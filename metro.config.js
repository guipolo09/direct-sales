const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// xlsx (SheetJS) tries to assign to read-only properties when bundled from
// source by Metro + Hermes. Using the pre-built dist bundle avoids this.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'xlsx') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/xlsx/dist/xlsx.full.min.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
