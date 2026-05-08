// Hook logiki parowania QR.
// Flow: wywołuje pair API → po sukcesie zapisuje credentials → ustawia auth state → navigate.

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { pairDevice } from '@/api/auth';
import { resetClient } from '@/api/client';
import { setSecure, SECURE_KEYS } from '@/lib/secureStorage';
import { useAuthStore } from '@/store/auth';
import type { QrPayloadV1 } from '@/types';
import { ApiError } from '@/api/client';

function getDeviceInfo() {
  return {
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? null,
    device_name: Device.deviceName ?? `${Platform.OS}-device`,
    device_model: Device.modelName ?? null,
  };
}

export function usePairing() {
  const setAuthState = useAuthStore((s) => s.setAuthState);

  return useMutation({
    mutationFn: async (payload: QrPayloadV1) => {
      const deviceInfo = getDeviceInfo();
      // pairDevice używa własnego axios.create() z tokenem w body — nie potrzebuje SecureStore
      return pairDevice(payload, deviceInfo);
    },
    onSuccess: async (data, payload) => {
      // Zapisz credentials DOPIERO po potwierdzonym sparowaniu
      await setSecure(SECURE_KEYS.apiHost, payload.host);
      await setSecure(SECURE_KEYS.apiToken, payload.token);
      await setSecure(SECURE_KEYS.tenantId, payload.tenant_id);
      await setSecure(SECURE_KEYS.userEmail, payload.user_email);
      // Reset klienta axios żeby pobrał nowe credentials przy następnym requeście
      resetClient();
      setAuthState({
        isPaired: true,
        user: data.user,
        tenant: data.tenant,
        apiHost: null, // apiHost trzymamy w secureStorage, nie w zustand
      });
      router.replace('/(tabs)/messenger');
    },
    onError: async (err) => {
      // Nic nie zostało zapisane do SecureStore — czyszczenie nie jest potrzebne
      // Reset klienta na wypadek gdyby był zanieczyszczony
      resetClient();
      setAuthState({ isPaired: false, user: null, tenant: null, apiHost: null });

      if (err instanceof ApiError && err.code === 'MOBILE_TOKEN_QR_EXPIRED') {
        // Błąd obsłużony w PairScreen przez rethrow
      }
    },
  });
}
