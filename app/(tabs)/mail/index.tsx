import { StyleSheet, Text, View } from 'react-native';

// TODO Sprint 2 (RN-009..RN-014):
// - lista folderow (GET /api/mail/folders)
// - lista wiadomosci w folderze (FlashList + infinite query)
// - szczegol wiadomosci, zalaczniki, mark read/star
// - cache offline ostatnich 200 wiadomosci (expo-sqlite)
export default function MailIndex() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skrzynka odbiorcza</Text>
      <Text style={styles.subtitle}>[Sprint 2] Tu pojawi sie lista folderow i wiadomosci.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 13, color: 'rgba(0, 0, 0, 0.6)', textAlign: 'center' },
});
