import colorsdef from 'colors/safe';
import fs from 'fs-extra';
import { sync as mkdirp } from 'mkdirp';
import { dirname, isAbsolute, resolve } from 'path';
import { sync as rimraf } from 'rimraf';
import webpack from 'webpack';
import lnk from 'lnk';
import { spawnSync } from "child_process";

import {
    buildDirChunk,
    commonWebpackConfig,
    cromwellStoreImportsPath,
    cromwellStoreModulesPath,
    getGlobalModuleStr,
    jsOperators,
    moduleMainBuidFileName,
    moduleMetaInfoFileName,
    parseImportsWebpackConfig,
} from './constants';
import { getCromwellaConfigSync, globPackages, isExternalForm, collectPackagesInfo } from './shared';
import { TAdditionalExports, TSciprtMetaInfo, TPackage, TFrontendDependency } from './types';
import symlinkDir from 'symlink-dir';

const NoEmitPlugin = require("no-emit-webpack-plugin");
const nodeExternals = require('webpack-node-externals');
const colors: any = colorsdef;
/**
 * Cromwella Bundler
 * Bundles frontend node_modules
 */



export const bundler = (projectRootDir: string, installationMode: string,
    isProduction: boolean, rebundle: boolean) => {

    const tempDir = resolve(projectRootDir, '.cromwell');
    const buildDir = resolve(tempDir, buildDirChunk);
    const moduleGeneratedFileName = 'generated.js';
    const moduleExportsDirChunk = 'generated';

    commonWebpackConfig.mode = isProduction ? 'production' : 'development';

    const publicDir = resolve(projectRootDir, 'public');
    const publicBuildLink = resolve(publicDir, buildDirChunk);
    if (!fs.existsSync(buildDir)) {
        mkdirp(buildDir);
    }
    symlinkDir(buildDir, publicBuildLink);

    const onPackagesCollected = async (packages: TPackage[]) => {

        if (rebundle && fs.existsSync(buildDir)) {
            rimraf(buildDir);
        }
        mkdirp(buildDir);

        // Collect frontendDependencies from cromwella.json in all packages 
        const frontendDependencies: TFrontendDependency[] = [];

        packages.forEach(pckg => {
            if (pckg && pckg.frontendDependencies && Array.isArray(pckg.frontendDependencies)) {
                pckg.frontendDependencies.forEach(dep => {
                    const frontendDep: TFrontendDependency = typeof dep === 'object' ? dep : {
                        name: dep
                    };
                    const depName: string = frontendDep.name;
                    const depVersion = pckg?.dependencies?.[depName] ?? pckg?.devDependencies?.[depName];
                    frontendDep.version = depVersion;

                    // if (!frontendDependencies.includes(dep))
                    if (frontendDependencies.every(mainDep => {
                        return !(mainDep.name === frontendDep.name && mainDep.version === frontendDep.version)
                    })) {
                        frontendDependencies.push(frontendDep);
                    }
                })

            }
        });


        // Parse cromwella.json configs
        const moduleExternals: Record<string, string[]> = {};
        const moduleBuiltins: Record<string, string[]> = {};
        const modulesExcludeExports: Record<string, string[]> = {};
        const modulesToIgnore: Record<string, string[]> = {};
        const modulesAdditionalExports: Record<string, TAdditionalExports[]> = {};
        const frontendDependenciesNames: string[] = [];

        frontendDependencies.forEach(dep => {
            if (dep.builtins) {
                moduleBuiltins[dep.name] = dep.builtins;
            }
            if (dep.externals) {
                moduleBuiltins[dep.name] = dep.externals;
            }
            if (dep.excludeExports) {
                modulesExcludeExports[dep.name] = dep.excludeExports;
            }
            if (dep.addExports) {
                modulesAdditionalExports[dep.name] = dep.addExports;
            }
            if (dep.ignore) {
                modulesToIgnore[dep.name] = dep.ignore;
            }
            frontendDependenciesNames.push(dep.name);
        });

        console.log(colors.cyan(`Cromwella:bundler: Found ${frontendDependencies.length} frontend modules to build: ${frontendDependencies.join(', ')}\n`));


        // Install node_modules locally

        const tempPckgName = '@cromwell/temp-budler'
        const tempPackageContent = {
            "name": tempPckgName,
            "version": "1.0.0",
            "private": true,
            "dependencies": Object.assign({}, ...frontendDependencies.map(dep => ({ [dep.name]: dep.version })))
        }
        fs.outputFileSync(`${buildDir}/package.json`, JSON.stringify(tempPackageContent, null, 4));

        spawnSync(`pnpm i --workspace`, { shell: true, cwd: buildDir, stdio: 'inherit' });


        /**
         * Helper to translate module's export key (namedImport) into generated file with all keys
         * @param namedImport module's export key
         * @param moduleName node module name as 'react'
         * @param importPath path to use in dynamic import() statement. 
         * @param modulePath full path to moduleName exporter. Preferably esm format. As /path/to/my/project/node_modules/@material-ui/core/esm/index.js
         * @param saveAsModules will also save this export as specified module names in the global store 
         */
        const makeImportString = (namedImport: string, moduleName: string, importPath: string,
            modulePath?: string, saveAsModules?: string[]): string => {

            importPath = importPath.replace(/\\/g, '/');
            let globalPropName = namedImport;
            let importerKey = namedImport;
            let saveAsModulesStr = '';

            if (saveAsModules && Array.isArray(saveAsModules)) {
                saveAsModulesStr = `, ${JSON.stringify(saveAsModules)}`
            }

            // Properties exported via "module.exports" can be the same as JS operators, we cannot code-split them
            // with current implementation via "import { prop } from '...';"
            // so just replace for 'default' to include whole lib instead.
            if (jsOperators.includes(namedImport)) {
                importPath = modulePath ?? require.resolve(moduleName).replace(/\\/g, '/');
                globalPropName = 'default';
            }

            return `
            '${importerKey}': () => {
                startImport(() => {
                    handleImport(import('${importPath}'), '${globalPropName}'${saveAsModulesStr});
                });
            },
            `;
        }


        // Stores export keys of modules that have been requested
        const modulesExportKeys: Record<string, string[]> = {};
        const getModuleExportKeys = (moduleName: string): string[] | undefined => {
            let exportKeys: string[] | undefined;
            if (!modulesExportKeys[moduleName]) {
                try {
                    let imported = require(moduleName);
                    exportKeys = Object.keys(imported);
                    if (!exportKeys.includes('default')) exportKeys.unshift('default');
                    modulesExportKeys[moduleName] = exportKeys;
                } catch (e) {
                    modulesExportKeys[moduleName] = [];
                    console.log(colors.brightYellow(`Cromwella:bundler: Failed to require() module: ${moduleName}`));
                }
            } else {
                exportKeys = modulesExportKeys[moduleName];
            }
            return exportKeys;
        }



        /**
         * Start bundling a node module. After bundling requsted moduleName will parse 
         * used modules and bundle them same way recursively
         * @param moduleName 
         */
        const bundleNodeModuleRecursive = async (moduleName: string) => {
            let modulePath: string | undefined;
            let moduleRootPath: string | undefined;
            try {
                modulePath = require.resolve(moduleName).replace(/\\/g, '/');
                moduleRootPath = dirname(require.resolve(`${moduleName}/package.json`)).replace(/\\/g, '/');
            } catch (e) {
                console.log(colors.brightYellow('Cromwella:bundler: required module ' + moduleName + ' is not found'));
            }
            if (!moduleRootPath && modulePath) {
                moduleRootPath = dirname(modulePath).replace(/\\/g, '/');;
            }

            const moduleBuildDir = resolve(buildDir, moduleName);
            const libEntry = resolve(moduleBuildDir, moduleGeneratedFileName);

            if (fs.existsSync(libEntry)) {
                // module has been bundled is some other chain of recursive calls
                return;
            }

            console.log(colors.cyan(`Cromwella:bundler: ${colors.brightCyan('Starting')} build module: ${colors.brightCyan(`"${moduleName}"`)} from path: ${modulePath}`));
            let imports = '';

            mkdirp(moduleBuildDir);


            // Get package.json to set all Dependencies as external and then transpile them same way
            let modulePackageJson: {
                dependencies?: Record<string, string>;
                peerDependencies?: Record<string, string>;
                module?: string
            } | undefined;
            const packageExternals: string[] = [...frontendDependenciesNames];
            if (moduleExternals[moduleName]) {
                moduleExternals[moduleName].forEach(ext => packageExternals.push(ext));
            }

            try {
                modulePackageJson = require(`${moduleName}/package.json`);
                if (!modulePackageJson) throw modulePackageJson;

                if (modulePackageJson.dependencies) {
                    Object.keys(modulePackageJson.dependencies).forEach(depName => {
                        packageExternals.push(depName);
                    })
                }
                if (modulePackageJson.peerDependencies) {
                    Object.keys(modulePackageJson.peerDependencies).forEach(depName => {
                        packageExternals.push(depName);
                    })
                }
            } catch (e) {
                console.error(colors.brightYellow('Cromwella:bundler:: Failed to read package.json dependencies of module: ' + moduleName));
            }

            // Find es module export
            if (moduleRootPath && modulePackageJson && modulePackageJson.module) {
                modulePath = resolve(moduleRootPath, modulePackageJson.module).replace(/\\/g, '/');
            }


            // Create a file for each export so webpack could make chunks for each export
            const handleExportKey = (exportKey: string, exportPath: string, importType?: 'default' | 'named', saveAsModules?: string[]) => {
                const excludeExports = modulesExcludeExports[moduleName];
                if (excludeExports && excludeExports.includes(exportKey)) return;


                const exportContentPath = resolve(moduleBuildDir, moduleExportsDirChunk, exportKey);
                imports += makeImportString(exportKey, moduleName, exportContentPath, modulePath, saveAsModules);

                if (jsOperators.includes(exportKey)) return;

                const importStr = importType === 'default' ? exportKey : `{${exportKey}}`;
                const exportContent = `
                import ${importStr} from '${exportPath}'
                export default ${exportKey};
                `;

                mkdirp(exportContentPath);
                fs.writeFileSync(resolve(exportContentPath, 'index.js'), exportContent);
            }

            const exportKeys = getModuleExportKeys(moduleName);

            if (exportKeys && modulePath) {
                console.log(colors.cyan(`Cromwella:bundler: Found ${exportKeys.length} exports for module ${moduleName}`));
                for (const exportKey of exportKeys) {
                    handleExportKey(exportKey, modulePath);
                }
            }

            const aditionalExports = modulesAdditionalExports[moduleName];
            if (aditionalExports) {
                aditionalExports.forEach(key => {
                    const path = key.path ?? modulePath;
                    if (path) handleExportKey(key.name, path, key.importType, key.saveAsModules)
                });
            }


            // Main generated file that contains references to generated chunks
            let content = `
            const moduleName = '${moduleName}';
            const _interopDefaultLegacy = (lib) => {
                if (lib && typeof lib === 'object' && 'default' in lib &&
                    Object.keys(lib).length === 1) {
                    return lib.default;
                }
                return lib;
            }

            const isServer = () => (typeof window === 'undefined');
            const getStore = () => {
                if (isServer()) {
                    if (!global.CromwellStore) global.CromwellStore = {};
                    return global.CromwellStore;
                }
                else {
                    if (!window.CromwellStore) window.CromwellStore = {};
                    return window.CromwellStore;
                }
            }
            const CromwellStore = getStore();

            if (!${cromwellStoreImportsPath}) ${cromwellStoreImportsPath} = {};
            if (!${cromwellStoreModulesPath}) ${cromwellStoreModulesPath} = {};
            if (!${getGlobalModuleStr(moduleName)}) {
                const module = {};
                ${getGlobalModuleStr(moduleName)} = module;
            }

            // If we once used 'default' import (which is whole lib), don't let it to make any other imports
            let didDefaultImport = false;

            const startImport = (cb) => {
                if (didDefaultImport) return;
                cb();
            }

            const handleImport = ((promise, importName, saveAsModules) => {
                if (didDefaultImport) return;
                if (importName === 'default') {
                    didDefaultImport = true;
                }
                promise.then(lib => {
                    if (importName === 'default') {
                        ${cromwellStoreModulesPath}[moduleName] = _interopDefaultLegacy(lib);
                    } else {
                        if (didDefaultImport) return;
                        ${cromwellStoreModulesPath}[moduleName][importName] = _interopDefaultLegacy(lib);
                    }
                    if (saveAsModules && Array.isArray(saveAsModules)) {
                        saveAsModules.forEach(modName => {
                            ${cromwellStoreModulesPath}[modName] = _interopDefaultLegacy(lib);
                        })
                    }
                })
            })

            ${cromwellStoreImportsPath}['${moduleName}'] = {
                ${imports}
            }
            `;

            fs.writeFileSync(libEntry, content);


            // 1. FIRST BUILD PASS
            // Run compiler to parse files and find actually used dependencies.

            const parsingWebpackConfig = Object.assign({}, parseImportsWebpackConfig);
            parsingWebpackConfig.output = Object.assign({}, parseImportsWebpackConfig.output);
            parsingWebpackConfig.output!.path = resolve(moduleBuildDir, 'parse_temp');
            parsingWebpackConfig.entry = libEntry;

            // { [moduleName]: namedExports }
            const usedExternals: Record<string, string[]> = {};

            // Used AND included in package.json
            const filteredUsedExternals: Record<string, string[]> = {};

            let moduleStats: any[] = [];

            const shouldLogBuild = false;

            // console.log('externals', externals);

            parsingWebpackConfig.externals = nodeExternals();
            if (!parsingWebpackConfig.plugins) parsingWebpackConfig.plugins = [];
            parsingWebpackConfig.plugins.push(new NoEmitPlugin());

            const compiler = webpack(parsingWebpackConfig);


            // Decryption of webpack's actually used modules via AST to define externals list
            compiler.hooks.normalModuleFactory.tap('CromwellaBundlerPlugin', factory => {
                factory.hooks.parser.for('javascript/auto').tap('CromwellaBundlerPlugin', (parser, options) => {
                    parser.hooks.importSpecifier.tap('CromwellaBundlerPlugin', (statement, source: string, exportName: string, identifierName: string) => {

                        if (!isExternalForm(source)) return;

                        if (moduleBuiltins[moduleName] && moduleBuiltins[moduleName].includes(source)) return;

                        const exportKeys = getModuleExportKeys(source);

                        if (!exportName && identifierName && exportKeys) {
                            if (exportKeys.includes(identifierName)) exportName = identifierName;
                            else exportName = 'default';
                        }
                        // if (source === 'react-dom' && moduleName === '@material-ui/core') console.log('react-dom', source, exportName, identifierName, JSON.stringify(statement, null, 2));

                        if (!exportKeys || exportKeys.length === 0) return;

                        if (!usedExternals[source]) usedExternals[source] = [];

                        if (exportName && exportKeys.includes(exportName) &&
                            !usedExternals[source].includes(exportName)) {

                            // Properties exported via "module.exports" can be the same as JS operators, we cannot code-split them
                            // with current implementation via "import { prop } from '...';"
                            // so just replace for 'default' to include whole lib instead 
                            if (jsOperators.includes(exportName)) {
                                exportName = 'default';
                            }

                            usedExternals[source].push(exportName);
                        }
                    });
                });
            });

            await new Promise((done) => {
                compiler.run(async (err, stats) => {

                    // Optimize used externals:
                    // If has "default" key with any other, leave only "default"
                    Object.keys(usedExternals).forEach(extName => {
                        if (usedExternals[extName].includes('default')) {
                            usedExternals[extName] = ['default'];
                        }
                    });
                    // If imported more than 80% of keys, replace them by one "default"
                    Object.keys(usedExternals).forEach(extName => {
                        if (usedExternals[extName].length > modulesExportKeys[extName].length * 0.8) {
                            usedExternals[extName] = ['default'];
                        }
                    });


                    Object.keys(usedExternals).forEach(extName => {
                        if (packageExternals.includes(extName)) {
                            filteredUsedExternals[extName] = usedExternals[extName];
                        }
                    })

                    // Create meta info file with actually used dependencies
                    const metaInfoPath = resolve(moduleBuildDir, moduleMetaInfoFileName);
                    const metaInfoContent: TSciprtMetaInfo = {
                        name: moduleName,
                        externalDependencies: filteredUsedExternals,
                    };
                    fs.writeFileSync(metaInfoPath, JSON.stringify(metaInfoContent, null, 4));

                    if (!stats.hasErrors() && !err && fs.existsSync(metaInfoPath)) {
                        console.log(colors.cyan('Cromwella:bundler: Parsed imports for module: ' + moduleName));
                    } else {
                        console.log(colors.brightRed('Cromwella:bundler: Failed to parse imports for module: ' + moduleName));
                        if (err) console.error(err);
                        if (stats) console.error(stats.toString({ colors: true }));
                    }

                    done();
                });
            });

            // Check if found used node_modules that weren't included in package.json
            // and hence weren't marked as externals in webpack config. 
            const notIncludedExts: string[] = []
            Object.keys(usedExternals).forEach(used => {
                if (!packageExternals.includes(used)) {
                    notIncludedExts.push(used);
                }
            });

            if (notIncludedExts.length > 0) {
                console.log(colors.brightYellow(`Cromwella:bundler: Found used node_modules of ${moduleName} that weren't included in package.json or cromwella.json : ${notIncludedExts.join(', ')}.`));
                console.log(colors.brightYellow(`Cromwella:bundler: All listed modules will be bundled with ${moduleName} and hence not reusable for other modules. This may cause bloating of bundles. Please configure encountered modules as externals.`));

            }


            // 2. SECOND BUILD PASS
            // Build module.

            // console.log(JSON.stringify(webpackConfig.externals, null, 2));
            const webpackConfig = Object.assign({}, commonWebpackConfig);
            webpackConfig.output = Object.assign({}, commonWebpackConfig.output);
            webpackConfig.entry = libEntry;
            webpackConfig.output!.library = moduleName.replace(/\W/g, '_');
            webpackConfig.output!.path = resolve(moduleBuildDir);
            webpackConfig.output!.publicPath = `/${buildDirChunk}/${moduleName}/`;

            if (modulesToIgnore[moduleName] && modulesToIgnore[moduleName].length > 0) {
                if (!webpackConfig.plugins) webpackConfig.plugins = [];
                webpackConfig.plugins.push(new webpack.IgnorePlugin({
                    checkResource(resource) {
                        return modulesToIgnore[moduleName].includes(resource);
                    }
                }))
            }

            webpackConfig.externals = Object.assign({}, ...packageExternals.map(ext => ({
                [ext]: `${getGlobalModuleStr(ext)}`
            })));

            const buildCompiler = webpack(webpackConfig);

            await new Promise((done) => {

                buildCompiler.run(async (err, stats) => {

                    if (shouldLogBuild) {
                        // const jsonStats = stats?.toString({ colors: true });
                        // console.log(jsonStats);

                        const jsonStatsPath = resolve(moduleBuildDir, 'build_stats.json');
                        fs.writeFileSync(jsonStatsPath, JSON.stringify(moduleStats, null, 4));
                    }

                    if (!stats.hasErrors() && !err && fs.existsSync(resolve(moduleBuildDir, moduleMainBuidFileName))) {
                        console.log(colors.brightGreen('Cromwella:bundler: Successfully built module: ' + moduleName));
                        // console.log(colors.cyan('usedExternals: \n' + JSON.stringify(usedExternals, null, 4)));
                        if (Object.keys(filteredUsedExternals).length > 0) {
                            console.log(colors.cyan(`Cromwella:bundler: Starting to build following used dependencies of module ${moduleName}: ${Object.keys(filteredUsedExternals).join(', ')}`));
                            for (const ext of Object.keys(filteredUsedExternals)) {
                                await bundleNodeModuleRecursive(ext);
                            }
                            console.log(colors.cyan(`Cromwella:bundler: All dependencies of module ${moduleName} has been built`));
                        }
                    } else {
                        console.log(colors.brightRed('Cromwella:bundler: Failed to built module: ' + moduleName));
                        if (err) console.error(err);
                        if (stats) console.error(stats?.toString({ colors: true }));
                    }
                    // console.log(stats?.toString({ colors: true }))
                    done();
                });

            })

            console.log(colors.cyan(`Cromwella:bundler: Module: ${colors.brightCyan(`"${moduleName}"`)} has been ${colors.brightCyan('processed')}`));
        }

        for (const moduleName of frontendDependenciesNames) {
            await bundleNodeModuleRecursive(moduleName);
        }
    }

    globPackages(projectRootDir, (packagePaths: string[]) => {
        collectPackagesInfo(packagePaths, (packages: TPackage[]) => {
            onPackagesCollected(packages);
        })
    });
}


// function cleanStringify(object) {
//     if (object && typeof object === 'object') {
//         object = copyWithoutCircularReferences([object], object);
//     }
//     return JSON.stringify(object);
//     function copyWithoutCircularReferences(references, object) {
//         var cleanObject = {};
//         Object.keys(object).forEach(function (key) {
//             var value = object[key];
//             if (value && typeof value === 'object') {
//                 if (references.indexOf(value) < 0) {
//                     references.push(value);
//                     cleanObject[key] = copyWithoutCircularReferences(references, value);
//                     references.pop();
//                 } else {
//                     cleanObject[key] = '###_Circular_###';
//                 }
//             } else if (typeof value !== 'function') {
//                 cleanObject[key] = value;
//             }
//         });
//         return cleanObject;
//     }
// }
