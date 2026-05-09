const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

// Sentry RN 7+ wymaga getSentryExpoConfig zamiast getDefaultConfig — bez tego
// source maps i component annotation nie sa generowane (componentStack pusty
// w erorach JS, brak nazwy komponentu zrodlowego w panelu Sentry).
const config = getSentryExpoConfig(__dirname, {});

module.exports = withNativeWind(config, { input: './global.css' });
