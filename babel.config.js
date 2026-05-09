module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // react-native-worklets/plugin MUSI byc ostatni.
      // Reanimated 4.x przenioslo plugin do paczki react-native-worklets.
      'react-native-worklets/plugin',
    ],
  };
};
