import '@/lib/i18n'; // i18next init — musi być przed renderowaniem
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { authLogoutEmitter } from '@/lib/authEvents';
import { useAuthStore } from '@/store/auth';
import { useBiometricUnlock } from '@/hooks/useBiometricUnlock';

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

function AppShell() {
  const resetAuth = useAuthStore((s) => s.resetAuth);
  const isPaired = useAuthStore((s) => s.isPaired);
  const { isUnlocked, unlock, isAvailable } = useBiometricUnlock();
  const backgroundedAt = useRef<number | null>(null);
  const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 min

  // Obsługa logout z interceptora 401
  useEffect(() => {
    return authLogoutEmitter.on(() => {
      resetAuth();
      router.replace('/(auth)/pair');
    });
  }, [resetAuth]);

  // Biometric lock po powrocie z tła po 5 min
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active' && backgroundedAt.current !== null) {
        const elapsed = Date.now() - backgroundedAt.current;
        if (elapsed >= LOCK_TIMEOUT_MS && isPaired && isAvailable) {
          void unlock();
        }
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, [isPaired, isAvailable, unlock]);

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
