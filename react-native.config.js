// react-native-worklets@0.6.1 jest wymagany jako babel plugin przez
// react-native-css-interop (NativeWind 4) — patrz transformer.js w jego dist/.
// Nie mozemy go usunac z dependencies (Metro bundle fail: "Cannot find module
// 'react-native-worklets/plugin'").
//
// Jednoczesnie react-native-reanimated@3.17 ma worklets wbudowane natywnie
// (NativeWorkletsModuleSpec). Autolinkowanie standalone react-native-worklets
// powoduje redefinicje symbolu C++ NativeWorkletsModuleSpecJSI w fazie CMake.
//
// Rozwiazanie: zostaw pakiet w node_modules (babel plugin), ale wylacz native
// autolinking — natywny C++ kod dostarcza Reanimated.
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
