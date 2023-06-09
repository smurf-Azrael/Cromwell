import { resolvePageRoute, setStoreItem, sleep, TCmsSettings, TPageInfo } from '@cromwell/core';
import { readCMSConfig } from '@cromwell/core-backend/dist/helpers/cms-settings';
import { rendererMessages } from '@cromwell/core-backend/dist/helpers/constants';
import { getLogger } from '@cromwell/core-backend/dist/helpers/logger';
import {
    buildDirName,
    getNodeModuleDir,
    getRendererStartupPath,
    getRendererTempDevDir,
    getThemeAdminPanelDir,
    getThemeBuildDir,
    getThemeRollupBuildDir,
    getThemeTempAdminPanelDir,
} from '@cromwell/core-backend/dist/helpers/paths';
import { getRestApiClient } from '@cromwell/core-frontend/dist/api/CRestApiClient';
import fs from 'fs-extra';
import glob from 'glob';
import fetch, { Response } from 'node-fetch';
import normalizePath from 'normalize-path';
import { resolve } from 'path';
import tcpPortUsed from 'tcp-port-used';

import managerConfig from '../config';
import { TRendererCommands } from '../constants';
import { closeService, closeServiceManager, isPortUsed, isServiceRunning, startService } from './baseManager';


const { cacheKeys, servicesEnv } = managerConfig;
const logger = getLogger();
const rendererStartupPath = getRendererStartupPath();

export const startRenderer = async (command?: TRendererCommands, options?: {
    port?: string | number;
}): Promise<boolean> => {
    const isBuild = command === 'build' || command === 'buildService';
    const port = options?.port ?? 4128;
    const cmsConfig = await readCMSConfig();
    setStoreItem('cmsSettings', cmsConfig);
    let cmsSettings: TCmsSettings | undefined = cmsConfig;

    if (!isBuild) {
        try {
            cmsSettings = await getRestApiClient()?.getCmsSettings({ disableLog: true });
        } catch (error) {
            logger.error(error);
        }
        if (!cmsSettings) {
            logger.error(`Failed to get cmsSettings from API server. Renderer will be launched with default theme`);
        }
    }

    if (!isBuild && await isPortUsed(Number(port))) {
        const message = `Manager: Failed to start Renderer: port ${port} is already in use. You may want to run stop command: npx cromwell stop --sv renderer`;
        logger.error(message);
        throw new Error(message);
    }

    const themeName = cmsSettings?.themeName ?? cmsSettings?.defaultSettings?.publicSettings?.themeName ??
        cmsConfig?.defaultSettings?.publicSettings?.themeName;

    if (!themeName) {
        logger.error(`Failed to find active theme name`);
        return false;
    }

    const rendererUrl = `http://localhost:${port}`;
    const rendererEnv = command ?? servicesEnv.renderer;

    if (rendererEnv && rendererStartupPath) {
        const rendererProc = await startService({
            path: rendererStartupPath,
            name: cacheKeys.renderer,
            args: [rendererEnv,
                `--theme-name=${themeName}`,
                `--port=${port}`,
            ],
            sync: command === 'build' ? true : false,
            watchName: !isBuild ? 'renderer' : undefined,
            onVersionChange: async () => {
                if (cmsConfig.useWatch) {
                    try {
                        await closeRenderer();
                    } catch (error) {
                        logger.error(error);
                    }

                    try {
                        await tcpPortUsed.waitUntilFree(parseInt(port as any), 500, 4000);
                    } catch (e) { logger.error(e) }

                    try {
                        await startRenderer(command, options);
                    } catch (error) {
                        logger.error(error);
                    }
                }
            }
        });

        if (command === 'build') return true;

        const onStartError = await new Promise(done => {
            const onMessage = async (message: string) => {
                if (message === rendererMessages.onStartMessage) {
                    done(false);
                }
                if (message === rendererMessages.onStartErrorMessage) {
                    done(true);
                }
            };
            rendererProc?.on('message', onMessage);
        });

        if (!onStartError) {
            if (!rendererUrl) return false;
            let success = false;
            try {
                const response: Response = await fetch(rendererUrl);
                success = response.status < 400;
            } catch (e) {
                logger.error(e);
            }

            await pollPages(port);

            if (success) logger.info(`Renderer has successfully started`);
            else logger.error(`Failed to start renderer`);

            startRendererAliveWatcher(command ?? 'prod', { port });
            return success;
        } else {
            const mess = 'RendererManager:: failed to start Renderer';
            logger.error(mess);
            return false;
        }
    }

    return false;
}

export const isRendererRunning = async (): Promise<boolean> => {
    return isServiceRunning(cacheKeys.renderer);
}

export const rendererBuild = async (themeName: string): Promise<boolean> => {
    if (!rendererStartupPath) return false;

    const command: TRendererCommands = 'build';

    const proc = await startService({
        path: rendererStartupPath,
        name: cacheKeys.rendererBuilder,
        args: [command, `--theme-name=${themeName}`],
    });

    await new Promise(done => {
        proc.on('message', async (message: string) => {
            if (message === rendererMessages.onBuildEndMessage) {
                done(true);
            }
        });
    })

    const success = await isThemeBuilt(getRendererTempDevDir());
    if (success) {
        logger.log('RendererManager:: Renderer build succeeded');
    } else {
        logger.error('RendererManager:: Renderer build failed');
    }

    return success;
}

export const rendererBuildAndSaveTheme = async (themeModuleName: string): Promise<boolean> => {
    const tempDir = getRendererTempDevDir();
    const tempNextDir = resolve(tempDir, '.next');

    const themeDir = await getNodeModuleDir(themeModuleName);
    if (!themeDir) return false;

    const buildSuccess = await rendererBuild(themeModuleName);
    if (!buildSuccess) return false;

    // Clean old build
    const themeBuildDir = await getThemeBuildDir(themeModuleName);
    if (themeBuildDir && await fs.pathExists(themeBuildDir)) {
        try {
            await fs.remove(themeBuildDir);
        } catch (e) {
            logger.error(e);
        }
        await sleep(0.1);
    }

    const themeBuildNextDir = resolve(themeDir, buildDirName, '.next');
    await sleep(0.1);
    try {
        if (await fs.pathExists(themeBuildNextDir)) await fs.remove(themeBuildNextDir);
    } catch (e) {
        logger.error(e);
    }
    await sleep(0.2);

    // Remove cache
    const nextCacheDir = resolve(tempNextDir, 'cache');
    if (await fs.pathExists(nextCacheDir)) await fs.remove(nextCacheDir);
    await sleep(0.1);

    // Remove generated HTML & JSON since either they generated with Theme's
    // author data or with no data at all, in any case, end-user will
    // have to re-generate them all.
    const nextPagesDir = resolve(tempNextDir, 'server/pages');
    const generatedPages = glob.sync(`${normalizePath(nextPagesDir)}/**/*.+(html|json)`);
    generatedPages.forEach(pageFile => {
        fs.removeSync(pageFile);
    });

    await fs.move(tempNextDir, themeBuildNextDir);
    await sleep(0.2);

    const themeRollupBuildDir = await getThemeRollupBuildDir(themeModuleName);
    const themeTempAdminBuildDir = getThemeTempAdminPanelDir();
    const adminBuildDir = await getThemeAdminPanelDir(themeModuleName);

    if (themeRollupBuildDir) {
        if (await fs.pathExists(themeRollupBuildDir)) await fs.remove(themeRollupBuildDir);
        await sleep(0.2);

        if (themeTempAdminBuildDir && adminBuildDir &&
            await fs.pathExists(themeTempAdminBuildDir)) {
            await fs.move(themeTempAdminBuildDir, adminBuildDir);
        }
    }

    await fs.remove(tempDir);
    await sleep(0.1);

    logger.log('RendererManager:: successfully saved theme');
    return true;
}


export const rendererStartWatchDev = async (themeName: string, port?: string) => {
    if (!rendererStartupPath) return false;

    const rendererTempDir = getRendererTempDevDir();
    await fs.ensureDir(rendererTempDir);

    const command: TRendererCommands = 'dev';

    await startService({
        path: rendererStartupPath,
        name: cacheKeys.renderer,
        args: [command, `--theme-name=${themeName}`, port ? '--port=' + port : ''],
    });
}

const isThemeBuilt = async (dir: string): Promise<boolean> => {
    return (await fs.pathExists(resolve(dir, '.next/static'))
        && await fs.pathExists(resolve(dir, '.next/BUILD_ID'))
        && await fs.pathExists(resolve(dir, '.next/build-manifest.json'))
        && await fs.pathExists(resolve(dir, '.next/prerender-manifest.json'))
    )
}

/** Poll all routes to make Next.js server generate and cache pages */
const pollPages = async (port: string | number) => {
    let infos: TPageInfo[] | undefined;
    try {
        infos = await getRestApiClient().getPagesInfo();
    } catch (error) {
        logger.error(error);
    }
    if (!infos) return;

    const promises = infos.filter(info => !info.route.startsWith('pages/')).map(async (info) => {
        for (let i = 0; i < 2; i++) {
            const pageRoute = await resolvePageRoute(info.route, {
                slug: 'test'
            });

            const pageUrl = `http://localhost:${port}${pageRoute}`;
            try {
                await fetch(pageUrl);
            } catch (e) {
                logger.error(e);
            }
        }
    });

    await Promise.all(promises);
}


let hasWatcherStarted = false;
const startRendererAliveWatcher = (command: TRendererCommands, options: {
    port: string | number;
}) => {
    if (hasWatcherStarted) return;
    hasWatcherStarted = true;
    rendererAliveWatcher(command, options);
}

const rendererAliveWatcher = async (command: TRendererCommands, options: {
    port: string | number;
}) => {
    await sleep(30);
    // Watch for the active server and if it's not alive for some reason, restart
    const { port } = options;
    let isAlive = true;
    try {
        if (port) {
            isAlive = await tcpPortUsed.check(parseInt(port as any), '127.0.0.1');
        }
    } catch (error) {
        logger.error(error);
    }

    if (!isAlive) {
        logger.error('Renderer manager watcher: Renderer is not alive. Restarting...');
        try {
            await closeRenderer();
        } catch (error) {
            logger.error(error)
        }

        try {
            await tcpPortUsed.waitUntilFree(parseInt(port as any), 500, 4000);
        } catch (e) { logger.error(e) }

        try {
            await startRenderer(command, options);
        } catch (error) {
            logger.error(error)
        }
    }

    rendererAliveWatcher(command, options);
}

export const closeRenderer = async (): Promise<boolean> => {
    if (await isRendererRunning()) {
        const success = await closeService(cacheKeys.renderer);
        if (!success) {
            logger.error('RendererManager::closeRenderer: failed to close Renderer by pid. Renderer is still active');
        } else {
            logger.log('RendererManager::closeRenderer: Renderer has been closed');
        }
        return success;
    }
    return true;

}

export const closeRendererManager = async (): Promise<boolean> => {
    if (await isRendererRunning()) {
        const success = await closeServiceManager(cacheKeys.renderer);
        if (!success) {
            logger.error('RendererManager::closeRenderer: failed to close Renderer by pid. Renderer is still active');
        } else {
            logger.log('RendererManager::closeRenderer: Renderer has been closed');
        }
        return success;
    }
    return true;
}