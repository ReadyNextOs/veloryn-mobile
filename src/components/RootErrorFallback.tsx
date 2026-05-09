// Lekki fallback dla Sentry.ErrorBoundary owijającego ROOT drzewo.
// Nie używa i18n ani innych providerów — bezpieczny gdy źródłem błędu jest
// init i18next albo Zustand persist. Komunikat hardkodowany (PL/EN) bez
// żadnych dependencies poza react-native.

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  // Sentry.ErrorBoundary fallback wpuszcza error jako unknown — defensywnie zawęzimy poniżej.
  error: unknown;
  componentStack: string | null;
  eventId: string;
  resetError: () => void;
}

export function RootErrorFallback({ error, resetError }: Props): React.JSX.Element {
  const message = error instanceof Error ? error.message : String(error);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coś poszło nie tak</Text>
      <Text style={styles.subtitle}>Something went wrong</Text>
      {__DEV__ ? <Text style={styles.devError}>{message}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={resetError} activeOpacity={0.75}>
        <Text style={styles.buttonText}>Spróbuj ponownie / Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.87)',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
    marginBottom: 24,
    textAlign: 'center',
  },
  devError: {
    fontSize: 12,
    color: '#d32f2f',
    fontFamily: 'Menlo',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#7a24a1',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
