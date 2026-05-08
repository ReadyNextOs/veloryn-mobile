import { useRef, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { isQrExpired, parseQrPayload } from '@/lib/qrSchema';
import { usePairing } from '@/hooks/usePairing';

export default function PairScreen() {
  const { t } = useTranslation('common');
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);
  const [isPairingInProgress, setIsPairingInProgress] = useState(false);

  const { mutateAsync: pair } = usePairing();

  async function handleBarCodeScanned({ data }: { data: string }): Promise<void> {
    // Throttle: ignoruj skanowanie podczas trwającego pair lub po pierwszym sukcesie
    if (scanLockRef.current || isPairingInProgress) return;
    scanLockRef.current = true;

    try {
      const payload = parseQrPayload(data);

      if (isQrExpired(payload)) {
        Alert.alert(t('common.error'), t('auth.pair.qrExpired'));
        return;
      }

      setIsPairingInProgress(true);
      await pair(payload);
      // Nawigacja do (tabs)/messenger jest wewnątrz usePairing
    } catch (err: unknown) {
      const isJsonError =
        err instanceof SyntaxError ||
        (err instanceof Error && err.name === 'ZodError');
      if (isJsonError) {
        Alert.alert(t('common.error'), t('auth.pair.invalidQr'));
      } else if (err instanceof Error && err.message.includes('MOBILE_TOKEN_QR_EXPIRED')) {
        Alert.alert(t('common.error'), t('auth.pair.qrExpired'));
      } else {
        Alert.alert(t('common.error'), err instanceof Error ? err.message : t('common.error'));
      }
      setIsPairingInProgress(false);
      // Zwolnij lock po błędzie żeby user mógł spróbować ponownie
      setTimeout(() => {
        scanLockRef.current = false;
      }, 2000);
    }
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('auth.pair.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.pair.permissionDenied')}</Text>
          {!permission.canAskAgain ? (
            <TouchableOpacity style={styles.permissionButton} onPress={() => Linking.openSettings()}>
              <Text style={styles.permissionButtonText}>{t('auth.pair.openSettings')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>{t('auth.pair.grantCameraAccess')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  function handleBackToLogin(): void {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.pair.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.pair.subtitle')}</Text>

        <View style={styles.cameraWrapper}>
          {isPairingInProgress ? (
            <View style={styles.pairingOverlay}>
              <Text style={styles.pairingText}>{t('auth.pair.pairing')}</Text>
            </View>
          ) : (
            <CameraView
              style={styles.camera}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarCodeScanned}
            />
          )}
        </View>

        <Text style={styles.instructions}>{t('auth.pair.scanInstructions')}</Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToLogin}
          disabled={isPairingInProgress}
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>{t('auth.pair.backToLogin')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7a24a1',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraWrapper: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7a24a1',
  },
  camera: { flex: 1 },
  pairingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(122, 36, 161, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pairingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7a24a1',
  },
  instructions: {
    marginTop: 16,
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#7a24a1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 10,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#7a24a1',
    fontSize: 14,
    fontWeight: '600',
  },
});
