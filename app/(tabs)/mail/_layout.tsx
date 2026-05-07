import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function MailLayout() {
  const { t } = useTranslation('common');

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1976d2' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: t('tabs.mail'), headerShown: true }}
      />
      <Stack.Screen
        name="[folderId]/index"
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="[folderId]/[messageId]"
        options={{ headerShown: true }}
      />
    </Stack>
  );
}
