import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-ts-compiler";
import packageJson from './package.json';
import { resolve } from 'path';
import fs from 'fs-extra';
import json from '@rollup/plugin-json';

const external = id => {
    const exts = ['util', 'path', 'colors/safe', 'webpack', 'webpack/lib/ExternalModuleFactoryPlugin'];
    for (const ext of exts) if (id === ext) return true;
    for (const pack of Object.keys(packageJson.dependencies)) {
        if (id === pack) {
            return true;
        }
    }
    for (const pack of Object.keys(packageJson.devDependencies)) {
        if (id === pack) {
            return true;
        }
    }
}

const buildDir = 'build';

const options = [
    {
        input: resolve(__dirname, "src/browser.ts"),
        output: [
            {
                file: resolve(__dirname, buildDir, 'browser/importer.js'),
                format: "iife",
            }
        ],
        plugins: [
            typescript({
                compilerOptions: {
                    module: 'ESNext',
                    target: 'ES5'
                },
                monorepo: true,
            }),
            commonjs(),
        ]
    },
    {
        preserveModules: true,
        input: resolve(__dirname, "src/exports.ts"),
        output: [
            {
                dir: resolve(__dirname, buildDir),
                format: "cjs",
            }
        ],
        external,
        plugins: [
            typescript({
                compilerOptions: {
                    module: 'ESNext',
                    declaration: true,
                    declarationMap: true,
                    declarationDir: resolve(__dirname, buildDir)
                },
                monorepo: true,
            }),
            json(),
        ]
    }
];

const bundlerPath = resolve(__dirname, "src/bundler/bundler.ts");
if (fs.pathExistsSync(bundlerPath)) {
    options.push({
        input: bundlerPath,
        output: [
            {
                dir: resolve(__dirname, 'bundler'),
                format: "cjs",
            }
        ],
        external,
        plugins: [
            typescript({
                compilerOptions: {
                    module: 'ESNext',
                    declaration: true,
                    declarationMap: true,
                    declarationDir: resolve(__dirname, buildDir)
                },
                monorepo: true,
            }),
            json(),
        ]

    });
}


export default options;