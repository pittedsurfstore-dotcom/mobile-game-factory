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

// @supabase/supabase-js declares @opentelemetry/api as an optional peer; we
// never use telemetry on the client so stub it out to an empty module to
// keep Metro happy without pulling in the package.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@opentelemetry/api': path.resolve(projectRoot, 'empty-module.js'),
};

module.exports = config;
