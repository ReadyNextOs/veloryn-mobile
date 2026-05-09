// Sentry init — side-effect import. Musi być importowany z `app/_layout.tsx`
// PRZED jakimkolwiek innym importem aplikacyjnym, żeby native crashy z bootstrap'u
// też trafiły do Sentry.
//
// DSN czytamy z EXPO_PUBLIC_SENTRY_DSN (per-profile env w eas.json). Brak DSN
// = no-op (przydatne dla local dev bez konta Sentry).

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Native crash reporting tylko w produkcyjnych buildach — w dev przez Metro
    // by konfliktowało z RN debug pipeline.
    enableNative: !__DEV__,
    // Verbose logging tylko w dev — żeby widzieć co Sentry robi.
    debug: __DEV__,
    // Performance tracing — 10% próbek żeby nie zalewać quota.
    tracesSampleRate: 0.1,
    // Environment widoczny w UI Sentry — pomaga filtrować dev vs prod.
    environment: __DEV__ ? 'development' : 'production',
    // Release tag — żeby grupować eventy per wersja apki.
    release: Constants.expoConfig?.version ?? '0.0.0',
  });
}

export { Sentry };
