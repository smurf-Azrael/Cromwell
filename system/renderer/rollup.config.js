import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-ts-compiler';
import packageJson from './package.json';

const { resolve } = require('path');

const external = id => {
    const exts = ['tslib', 'util', 'path'];

    if (id.includes('.cromwell/imports') || id.includes('cromwell/plugins')
        || id.includes('cromwell/themes'))
        return true;

    for (const ext of exts) if (id === ext) return true;

    for (const pack of Object.keys(packageJson.dependencies)) {
        if (id === pack) {
            return true;
        }
    }
}

const buildDir = 'build';

const typescriptOptions = {
    compilerOptions: {
        module: 'ESNext',
        declaration: true,
        declarationMap: true,
        declarationDir: resolve(__dirname, buildDir)
    },
    sharedState: {},
    monorepo: true,
}

export default [
    {
        // preserveModules: true,
        input: resolve(__dirname, "src/index.ts"),
        output: [
            {
                file: resolve(__dirname, buildDir, 'renderer.js'),
                // dir: './build',
                format: "esm",
            }
        ],
        external,
        plugins: [
            typescript(typescriptOptions),
            commonjs(),
            json(),
        ]
    },
    {
        input: resolve(__dirname, "src/generator.ts"),
        output: [
            {
                file: resolve(__dirname, buildDir, 'generator.js'),
                format: "cjs",
            }
        ],
        external,
        plugins: [
            typescript(typescriptOptions),
            commonjs(),
        ]
    },
    {
        input: resolve(__dirname, "src/server.ts"),
        output: [
            {
                file: resolve(__dirname, buildDir, 'server.js'),
                format: "cjs",
            }
        ],
        external,
        plugins: [
            typescript(typescriptOptions),
            commonjs(),
        ]
    },
];