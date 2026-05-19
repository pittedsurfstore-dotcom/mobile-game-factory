const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// posthog-react-native@4 ships subpath exports like `@posthog/core/surveys`
// which Metro only resolves when this flag is on. Without it the iOS bundle
// fails to find `@posthog/core/surveys`.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
