import '@/lib/i18n'; // i18next init — musi być przed renderowaniem
import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authLogoutEmitter } from '@/lib/authEvents';
import { useAuthStore } from '@/store/auth';
import { useBiometricUnlock } from '@/hooks/useBiometricUnlock';
import { clearMailCache } from '@/lib/db';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min

function AppShell() {
  const resetAuth = useAuthStore((s) => s.resetAuth);
  const isPaired = useAuthStore((s) => s.isPaired);
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const setUnlocked = useAuthStore((s) => s.setUnlocked);
  const lastBackgroundedAt = useAuthStore((s) => s.lastBackgroundedAt);
  const setLastBackgroundedAt = useAuthStore((s) => s.setLastBackgroundedAt);
  const { isAvailable } = useBiometricUnlock();

  // Obsługa logout z interceptora 401
  useEffect(() => {
    return authLogoutEmitter.on(() => {
      resetAuth(); // zeruje też isUnlocked + lastBackgroundedAt
      clearMailCache().catch(console.error); // wyczysć cache — nie blokuj logout przy błędzie
      router.replace('/(auth)/pair');
    });
  }, [resetAuth]);

  // Biometric lock po powrocie z tła po 5 min
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        setLastBackgroundedAt(Date.now());
        // Natychmiastowe zablokowanie przy przejściu do tła
        setUnlocked(false);
      } else if (nextState === 'active' && lastBackgroundedAt !== null) {
        const elapsed = Date.now() - lastBackgroundedAt;
        if (elapsed < LOCK_TIMEOUT_MS) {
          // Krótkie tło (< 5 min) — odblokuj bez biometrii
          setUnlocked(true);
        }
        // Jeśli >= 5 min — zostaje locked (isUnlocked=false), locked screen pojawi się
        setLastBackgroundedAt(null);
      }
    });
    return () => sub.remove();
  }, [isPaired, isAvailable, lastBackgroundedAt, setLastBackgroundedAt, setUnlocked]);

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
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="locked" />
      </Stack>
    </>
  );
}
