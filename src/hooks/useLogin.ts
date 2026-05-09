// Hook logowania urządzenia za pomocą e-mail + hasło.
// Flow: wywołuje login API → po sukcesie zapisuje credentials → ustawia auth state → navigate.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { loginWithCredentials } from '@/api/auth';
import { resetClient } from '@/api/client';
import { setSecure, SECURE_KEYS } from '@/lib/secureStorage';
import { useAuthStore } from '@/store/auth';

interface LoginInput {
  host: string;
  /** Username lub e-mail — backend akceptuje oba. */
  login: string;
  password: string;
}

function getDeviceInfo(): {
  platform: string;
  app_version: string | null;
  device_name: string | null;
  device_model: string | null;
} {
  return {
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? null,
    device_name: Device.deviceName ?? `${Platform.OS}-device`,
    device_model: Device.modelName ?? null,
  };
}

/**
 * Veloryn nginx domyślnie hostuje backend pod prefiksem `/backend/api/...`
 * (alias w sites-enabled). Klient mobile akceptuje sam hostname (np.
 * "https://prod.veloryn.pl") — auto-dopisujemy "/backend" jeśli URL nie
 * ma jeszcze pathu, żeby user nie musiał o tym pamiętać.
 *
 * Reguły:
 * - jeśli user wpisze pełny URL z pathem ("/backend", "/api", "/foo") — szanujemy go
 * - jeśli user wpisze sam host (bez pathu lub z pojedynczym "/") — dodajemy "/backend"
 */
function normalizeHost(host: string): string {
  const trimmed = host.trim();
  if (!trimmed) {
    return trimmed;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const stripped = withProtocol.replace(/\/+$/, '');

  try {
    const url = new URL(stripped);
    const hasPath = url.pathname && url.pathname !== '' && url.pathname !== '/';
    if (!hasPath) {
      return `${url.origin}/backend`;
    }
    return stripped;
  } catch {
    return stripped;
  }
}

export function useLogin() {
  const setAuthState = useAuthStore((s) => s.setAuthState);

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const host = normalizeHost(input.host);
      const deviceInfo = getDeviceInfo();
      const data = await loginWithCredentials(host, {
        login: input.login.trim(),
        password: input.password,
        device_info: deviceInfo,
      });
      return { ...data, requestedHost: host };
    },
    onSuccess: async (data) => {
      // Backend zwraca canonical host w `data.host` (config('app.url')).
      // Zapisujemy host z którym mobile faktycznie się komunikuje (requestedHost),
      // żeby kolejne requesty trafiały na ten sam endpoint co login.
      const persistedHost = data.requestedHost || data.host;

      await setSecure(SECURE_KEYS.apiHost, persistedHost);
      await setSecure(SECURE_KEYS.apiToken, data.token);
      await setSecure(SECURE_KEYS.tenantId, data.tenant.id);
      await setSecure(SECURE_KEYS.userEmail, data.user.email);

      resetClient();

      setAuthState({
        isPaired: true,
        user: data.user,
        tenant: data.tenant,
        apiHost: persistedHost,
      });

      router.replace('/(app)/dashboard');
    },
    onError: () => {
      // Nic nie zostało zapisane do SecureStore — czyszczenie nie jest konieczne.
      resetClient();
    },
  });
}
