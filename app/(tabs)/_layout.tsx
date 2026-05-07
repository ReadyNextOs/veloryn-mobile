import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#1976d2',
      }}
    >
      <Tabs.Screen
        name="mail"
        options={{
          title: 'Poczta',
        }}
      />
      <Tabs.Screen
        name="messenger"
        options={{
          title: 'Komunikator',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
        }}
      />
    </Tabs>
  );
}
