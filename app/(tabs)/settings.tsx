import { StyleSheet, Text, View } from 'react-native';

// TODO Sprint 3 (RN-022):
// - lista sparowanych urzadzen (DELETE wlasnego = wylogowanie)
// - preferencje push (per-kategoria: mail, messages, mentions)
// - jezyk apki (i18n: pl, en, cs, uk, es)
// - "O aplikacji" + wersja + przycisk wyloguj
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ustawienia</Text>
      <Text style={styles.subtitle}>[Sprint 3] Tu pojawia sie ustawienia konta i powiadomien.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 13, color: 'rgba(0, 0, 0, 0.6)', textAlign: 'center' },
});
