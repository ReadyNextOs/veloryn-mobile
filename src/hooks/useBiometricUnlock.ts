// Hook do biometrycznego odblokowania aplikacji.
// Sprawdza dostępność sprzętu, wywołuje LocalAuthentication.
// Stan isUnlocked jest globalny (Zustand) — używany przez _layout.tsx i locked.tsx.

import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';

interface BiometricUnlockResult {
  /** Czy aplikacja jest aktualnie odblokowana (z Zustand — globalny). */
  isUnlocked: boolean;
  /** Wywołaj prompt biometryczny. */
  unlock: () => Promise<void>;
  /** Czy urządzenie ma dostępną biometrię (hardware + enrollment). */
  isAvailable: boolean;
}

export function useBiometricUnlock(): BiometricUnlockResult {
  const { t } = useTranslation('common');
  // isUnlocked pochodzi z Zustand — shared między _layout i locked screen
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  const setUnlocked = useAuthStore((s) => s.setUnlocked);
  // isAvailable to lokalny stan init — nie wymaga globalnego store
  const [isAvailable, setIsAvailable] = useState(false);

  // Sprawdź dostępność biometrii przy mount
  useEffect(() => {
    async function checkAvailability() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(hasHardware && isEnrolled);
      // Jeśli biometria niedostępna → uznaj za odblokowane
      if (!hasHardware || !isEnrolled) {
        setUnlocked(true);
      }
    }
    void checkAvailability();
  }, [setUnlocked]);

  const unlock = useCallback(async () => {
    if (!isAvailable) {
      setUnlocked(true);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('auth.biometric.prompt'),
      fallbackLabel: t('auth.biometric.usePin'),
      cancelLabel: t('common.cancel'),
    });
    if (result.success) {
      setUnlocked(true);
    }
  }, [isAvailable, setUnlocked, t]);

  return { isUnlocked, unlock, isAvailable };
}
