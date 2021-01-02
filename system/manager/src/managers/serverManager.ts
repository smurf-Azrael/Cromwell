import { getLogger, getServerStartupPath, serverMessages } from '@cromwell/core-backend';

import config from '../config';
import { TServerCommands } from '../constants';
import { closeService, startService } from './baseManager';

const { cacheKeys, servicesEnv } = config;
const logger = getLogger('errors-only');
const serverStartupPath = getServerStartupPath();

export const startServer = async (command?: TServerCommands): Promise<boolean> => {
    let serverProc;
    const env = command ?? servicesEnv.server;
    if (env && serverStartupPath) {
        serverProc = startService(serverStartupPath, cacheKeys.server, [env])
    }

    if (serverProc) {
        return new Promise(done => {
            const onMessage = async (message: string) => {
                if (message === serverMessages.onStartMessage) {
                    logger.log(`ServerManager:: Server has successfully started`);
                    done(true);
                }
                if (message === serverMessages.onStartErrorMessage) {
                    logger.error(`ServerManager:: Failed to start Server`);
                    done(false);
                }
            }
            serverProc.on('message', onMessage);
        })
    }
    return false;
}

export const closeServer = async (): Promise<boolean> => {
    return closeService(cacheKeys.server);
}

