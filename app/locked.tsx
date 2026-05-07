// Ekran blokady — pokazywany gdy aplikacja wróciła z tła po >5 min
// i wymaga ponownej weryfikacji biometrycznej.

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useBiometricUnlock } from '@/hooks/useBiometricUnlock';

export default function LockedScreen() {
  const { t } = useTranslation('common');
  const { unlock } = useBiometricUnlock();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>{t('auth.biometric.lockedTitle')}</Text>
        <TouchableOpacity style={styles.button} onPress={unlock}>
          <Text style={styles.buttonText}>{t('auth.biometric.retry')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: { fontSize: 64, marginBottom: 24 },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.87)',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
