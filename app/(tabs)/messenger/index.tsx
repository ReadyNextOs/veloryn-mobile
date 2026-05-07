import { StyleSheet, Text, View } from 'react-native';

// TODO Sprint 3 (RN-015..RN-019):
// - lista watkow (GET /messenger/threads)
// - szczegol watku + lista wiadomosci (FlashList inverted)
// - input + wysylka (optimistic UI)
// - integracja Echo/Reverb (subskrypcja kanalow)
// - typing indicator + reactions
export default function MessengerIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Komunikator</Text>
      <Text style={styles.subtitle}>[Sprint 3] Tu pojawi sie lista watkow.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 13, color: 'rgba(0, 0, 0, 0.6)', textAlign: 'center' },
});
