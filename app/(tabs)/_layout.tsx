import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

const BRAND_BLUE = '#1976d2';
const TAB_INACTIVE = 'rgba(0, 0, 0, 0.45)';
// Placeholder unread counts — podpięcie do store w Sprint 2/3
const UNREAD_MAIL = 0;
const UNREAD_MESSENGER = 0;

export default function TabsLayout() {
  const { t } = useTranslation('common');

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: BRAND_BLUE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarStyle: { borderTopColor: 'rgba(0,0,0,0.08)' },
        headerStyle: { backgroundColor: BRAND_BLUE },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="mail"
        options={{
          title: t('tabs.mail'),
          tabBarBadge: UNREAD_MAIL > 0 ? UNREAD_MAIL : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="email-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messenger"
        options={{
          title: t('tabs.messenger'),
          tabBarBadge: UNREAD_MESSENGER > 0 ? UNREAD_MESSENGER : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
