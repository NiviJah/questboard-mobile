const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'js', 'jsx', 'ts', 'tsx'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
