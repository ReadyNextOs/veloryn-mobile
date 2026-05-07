import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '',
      }}
    >
      <Stack.Screen name="pair" options={{ title: 'Sparuj urzadzenie' }} />
    </Stack>
  );
}
