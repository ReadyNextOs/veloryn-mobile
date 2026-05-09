// Centralny logout flow — jeden punkt prawdy dla manualnego logout (drawer/settings)
// i automatycznego (interceptor 401). Konsoliduje czyszczenie:
//  - revoke tokena na backendzie (best-effort, tylko gdy revokeOnServer=true)
//  - reset axios singleton
//  - wymazanie SecureStore (apiToken, apiHost, tenantId, userEmail)
//  - wyczyszczenie SQLite cache poczty
//  - wyczyszczenie cache TanStack Query (zapobiega leakom danych do następnej sesji)
//  - reset Zustand auth store
//  - emit eventu 'auth:logout' (dla potencjalnych dodatkowych listenerów)
//  - redirect do ekranu logowania
//
// 401 interceptor wywołuje { revokeOnServer: false } — token jest już nieważny,
// nie ma sensu robić DELETE, który i tak zwróci 401.

import { router } from 'expo-router';
import { Sentry } from '@/lib/sentry';
import { apiDelete, resetClient } from '@/api/client';
import { clearAllSecure } from '@/lib/secureStorage';
import { clearMailCache } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/auth';
import { authLogoutEmitter } from '@/lib/authEvents';

interface PerformLogoutOptions {
  /** Czy próbować odwołać token na backendzie (DELETE /api/auth/mobile-tokens/current). */
  revokeOnServer: boolean;
  /** Czy wyemitować event 'auth:logout' (domyślnie true). 401 interceptor już emituje sam,
   *  więc gdy listener tego eventu wywołuje performLogout — ustaw false, żeby uniknąć pętli. */
  emitEvent?: boolean;
}

let _logoutInFlight = false;

export async function performLogout({
  revokeOnServer,
  emitEvent = true,
}: PerformLogoutOptions): Promise<void> {
  // Idempotency guard — gdy user szybko klika logout 2x lub 401 + manualny logout się ścigają.
  if (_logoutInFlight) return;
  _logoutInFlight = true;

  try {
    if (revokeOnServer) {
      try {
        await apiDelete('/api/auth/mobile-tokens/current');
      } catch {
        // best-effort revoke — token i tak czyścimy lokalnie
      }
    }

    resetClient();
    await clearAllSecure();
    await clearMailCache().catch((err) => {
      // SQLite błąd nie powinien blokować logout — log do Sentry, nie do console
      Sentry.captureException(err);
    });
    queryClient.clear();
    useAuthStore.getState().resetAuth();

    if (emitEvent) {
      authLogoutEmitter.emit('auth:logout');
    }

    router.replace('/(auth)/login');
  } finally {
    _logoutInFlight = false;
  }
}
