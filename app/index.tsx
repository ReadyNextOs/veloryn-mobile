import { Redirect } from 'expo-router';

// TODO Sprint 1: czytaj sparowany token z expo-secure-store i przekieruj
// odpowiednio do (auth)/pair albo (tabs)/messenger.
export default function Index() {
  const isPaired = false;
  return <Redirect href={isPaired ? '/(tabs)/messenger' : '/(auth)/pair'} />;
}
