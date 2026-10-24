const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole monorepo root (incl. packages/shared) so Metro picks up
// changes to workspace packages, not just apps/mobile itself.
config.watchFolders = [monorepoRoot];

// Resolve node_modules from both apps/mobile and the hoisted workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
