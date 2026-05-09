import '@/lib/sentry'; // Sentry init — MUSI być pierwszym importem (native crash reporting)
import 'react-native-gesture-handler';
import '../global.css'; // NativeWind — Tailwind utilities dla rn-reusables
import '@/lib/i18n'; // i18next init — musi być przed renderowaniem
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { Sentry } from '@/lib/sentry';
import { RootErrorFallback } from '@/components/RootErrorFallback';
import { authLogoutEmitter } from '@/lib/authEvents';
import { useAuthStore } from '@/store/auth';
import { useBiometricUnlock } from '@/hooks/useBiometricUnlock';
import { performLogout } from '@/lib/logout';
import { queryClient } from '@/lib/queryClient';
import { usePushRegistration } from '@/hooks/usePushRegistration';

// Trzymaj splash dopóki Zustand persist nie zakończy hydratacji z SecureStore.
// Bez tego AppShell zwraca null podczas async load, a splash znika za wcześnie
// → user widzi biały ekran przez kilka sekund.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

// Konfiguracja obsługi powiadomień w foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayout() {
  return (
    <Sentry.ErrorBoundary fallback={(props) => <RootErrorFallback {...props} />}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppShell />
        </QueryClientProvider>
      </SafeAreaProvider>
    </Sentry.ErrorBoundary>
  );
}

// Sentry.wrap rejestruje natywne handler'y (Java/ObjC/JS) na wrapped komponencie.
// Bez tego native crash w runtime nie trafi do Sentry mimo enableNative=true.
export default Sentry.wrap(RootLayout);

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min

function AppShell() {
  // Czekaj na zakończenie hydratacji Zustand persist (SecureStore jest async).
  // Bez tej gwarancji isPaired może być false w pierwszym renderze mimo zapisanego stanu,
  // co prowadzi do błędnego przekierowania na pair screen oraz API calls bez Bearer tokenu.
  const [hasHydrated, setHasHydrated] = useState(
    () => useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (!hasHydrated) {
      return useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
    }
    return undefined;
  }, [hasHydrated]);

  // Ukryj splash dopiero gdy hydratacja zakończona — wcześniej AppShell zwraca null.
  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [hasHydrated]);

  // Push registration — po sparowaniu rejestruje Expo Push Token
  usePushRegistration();

  const isPaired = useAuthStore((s) => s.isPaired);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const setUnlocked = useAuthStore((s) => s.setUnlocked);
  const setLastBackgroundedAt = useAuthStore((s) => s.setLastBackgroundedAt);
  const { isAvailable } = useBiometricUnlock();

  // Obsługa logout z interceptora 401 — token już nieważny, nie revokeOnServer.
  // emitEvent=false, bo TO jest listener tego eventu — uniknąć rekursji.
  useEffect(() => {
    return authLogoutEmitter.on(() => {
      void performLogout({ revokeOnServer: false, emitEvent: false });
    });
  }, []);

  // Biometric lock po powrocie z tła po 5 min.
  // KRYTYCZNE: lastBackgroundedAt czytany z getState() w handlerze (nie z closure),
  // żeby uniknąć stale-state race przy szybkim bg→fg→bg→fg.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        setLastBackgroundedAt(Date.now());
        setUnlocked(false);
      } else if (nextState === 'active') {
        const ts = useAuthStore.getState().lastBackgroundedAt;
        if (ts !== null) {
          const elapsed = Date.now() - ts;
          if (elapsed < LOCK_TIMEOUT_MS) {
            setUnlocked(true);
          }
          // Jeśli >= 5 min — zostaje locked, locked screen pojawi się przy renderze
          setLastBackgroundedAt(null);
        }
      }
    });
    return () => sub.remove();
  }, [setLastBackgroundedAt, setUnlocked]);

  // Nie renderuj nic przed zakończeniem hydratacji — zapobiega błędnym przekierowaniom
  // i API calls bez tokenu Bearer gdy SecureStore jeszcze czyta stan.
  if (!hasHydrated) {
    return null;
  }

  // Jeśli sparowany + biometria dostępna + nie odblokowany → locked screen
  if (isPaired && isAvailable && !isUnlocked) {
    return (
      <>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="locked" />
        </Stack>
      </>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="locked" />
      </Stack>
    </>
  );
}
