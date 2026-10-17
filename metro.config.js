// EN: Extends Expo's Metro defaults so SVG files are transformed into React Native components instead of bundled as opaque assets.
// UK: Розширює стандартну конфігурацію Metro від Expo, щоб SVG перетворювалися на компоненти React Native, а не на непрозорі ресурси.

const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  return config;
})();
