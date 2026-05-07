import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// TODO Sprint 1 (RN-005, RN-006):
// - integracja expo-camera (CameraView z barcodeScannerSettings)
// - parsowanie QrPayloadV1, walidacja schema (Zod)
// - GET /api/me z Bearer tokenem
// - zapis tokenu w expo-secure-store
// - rejestracja Expo Push tokenu na backendzie
// - redirect do (tabs)/messenger
export default function PairScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Sparuj z Veloryn</Text>
        <Text style={styles.subtitle}>
          Otworz Veloryn w przegladarce, przejdz do Profil → Urzadzenia mobilne
          i zeskanuj wygenerowany kod QR.
        </Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            [TODO] Tu pojawi sie podglad kamery (expo-camera)
          </Text>
        </View>
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
    color: '#1976d2',
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
  placeholder: {
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#1976d2',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
});
