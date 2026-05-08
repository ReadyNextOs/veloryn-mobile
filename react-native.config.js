// react-native-worklets jest uzywany TYLKO jako babel plugin
// (compile-time JS) przez react-native-css-interop (NativeWind 4).
// react-native-reanimated@3.17.4 ma worklets wbudowane natywnie, wiec
// autolinkowanie standalone react-native-worklets powoduje redefinicje
// symbolu C++ NativeWorkletsModuleSpecJSI w fazie CMake.
// Wykluczamy go z native autolinking — plugin JS pozostaje dostepny.
module.exports = {
  dependencies: {
    'react-native-worklets': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
