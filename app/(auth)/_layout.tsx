import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: '',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="pair"
        options={{
          title: '',
          headerShown: true,
          headerTransparent: true,
          headerTintColor: '#7a24a1',
          headerBackTitle: '',
        }}
      />
    </Stack>
  );
}
