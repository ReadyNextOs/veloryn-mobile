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
    // Diagnostyka po-loginowych crashy: bez source map upload Sentry RN
    // czasem traci natywne wyjatki. Globalny ErrorUtils handler zapewnia
    // ze KAZDY uncaught JS error idzie do Sentry zanim apka rzuci RN red box.
    integrations: (defaults) => defaults,
    // attachStacktrace: true ulatwia diagnoze gdy mamy tylko captureMessage.
    attachStacktrace: true,
  });

  // Globalny JS error handler — fallback gdy Sentry RN auto-handler nie zlapie
  // (np. blad w setup phase przed pelna inicjalizacja native).
  const errorUtils = (globalThis as { ErrorUtils?: { setGlobalHandler: (cb: (e: Error, isFatal?: boolean) => void) => void; getGlobalHandler: () => (e: Error, isFatal?: boolean) => void } }).ErrorUtils;
  if (errorUtils) {
    const originalHandler = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      Sentry.captureException(error, { tags: { source: 'global_handler', fatal: String(isFatal ?? false) } });
      // Nie blokuj defaultowego zachowania — pozwol RN pokazac/zamknac aplikacje.
      originalHandler(error, isFatal);
    });
  }
}

export { Sentry };
