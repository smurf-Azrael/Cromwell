

export const buildDirChunk = 'built_modules';

export const moduleMainBuidFileName = 'main.bundle.js';
export const moduleNodeBuidFileName = 'node.bundle.js';
export const moduleMetaInfoFileName = 'meta.json';

export const moduleGeneratedFileName = 'generated.js';
export const moduleNodeGeneratedFileName = 'generated.node.js';
export const moduleExportsDirChunk = 'generated';

export const jsOperators = ['let', 'var', 'const', 'function', 'class', 'new', 'delete',
    'import', 'export', 'default', 'typeof', 'in', 'of', 'instanceof', 'void',
    'await', 'return', 'try', 'catch', 'throw', 'if', 'else', 'switch', 'case'];

export const cromwellStoreModulesPath = 'CromwellStore.nodeModules.modules';
export const cromwellStoreImportsPath = 'CromwellStore.nodeModules.imports';
export const getGlobalModuleStr = (moduleName: string) => `${cromwellStoreModulesPath}['${moduleName}']`;
export const getDepVersion = (pckg: any, depName: string): string | undefined => pckg?.dependencies?.[depName] ?? pckg?.devDependencies?.[depName] ?? pckg?.peerDependencies?.[depName];

export const moduleChunksBuildDirChunk = 'chunks';

