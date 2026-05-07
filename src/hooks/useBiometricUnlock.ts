// Hook do biometrycznego odblokowania aplikacji.
// Sprawdza dostępność sprzętu, wywołuje LocalAuthentication i zarządza stanem isUnlocked.

import { useCallback, useEffect, useState } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';

interface BiometricUnlockResult {
  /** Czy aplikacja jest aktualnie odblokowana. */
  isUnlocked: boolean;
  /** Wywołaj prompt biometryczny. */
  unlock: () => Promise<void>;
  /** Czy urządzenie ma dostępną biometrię (hardware + enrollment). */
  isAvailable: boolean;
}

export function useBiometricUnlock(): BiometricUnlockResult {
  const { t } = useTranslation('common');
  const [isAvailable, setIsAvailable] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Sprawdź dostępność biometrii przy mount
  useEffect(() => {
    async function checkAvailability() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(hasHardware && isEnrolled);
      // Jeśli biometria niedostępna → uznaj za odblokowane
      if (!hasHardware || !isEnrolled) {
        setIsUnlocked(true);
      }
    }
    void checkAvailability();
  }, []);

  const unlock = useCallback(async () => {
    if (!isAvailable) {
      setIsUnlocked(true);
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('auth.biometric.prompt'),
      fallbackLabel: t('auth.biometric.usePin'),
      cancelLabel: t('common.cancel'),
    });
    if (result.success) {
      setIsUnlocked(true);
    }
  }, [isAvailable, t]);

  return { isUnlocked, unlock, isAvailable };
}
