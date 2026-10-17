// EN: Extends Expo's Metro defaults so SVG files are transformed into React Native components instead of bundled as opaque assets.
// UK: Розширює стандартну конфігурацію Metro від Expo, щоб SVG перетворювалися на компоненти React Native, а не на непрозорі ресурси.

const { getDefaultConfig } = require('expo/metro-config');

module.exports = (/** EN: Creates the Metro configuration that routes SVG imports through the component transformer. UK: Створює конфігурацію Metro, яка спрямовує імпорти SVG через перетворювач компонентів. */ () => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(/* EN: Removes SVG from opaque asset extensions so the transformer receives it. UK: Вилучає SVG зі списку непрозорих ресурсів, щоб файл отримав перетворювач. */ (ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  return config;
})();
