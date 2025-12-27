const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude these directories from being watched or resolved by Metro
config.resolver.blockList = [
    /.*\/backend\/.*/,
    /.*\/.venv\/.*/,
    /^dist\/.*/, // Anchored to only target root dist
];

// pdf-parse is a Node-only module. We mock it for native platforms
// to prevent Metro from failing during the 'npx expo export:embed' step.
config.resolver.extraNodeModules = {
    'pdf-parse': 'node-modules-polyfills/pdf-parse-mock',
};

module.exports = config;
