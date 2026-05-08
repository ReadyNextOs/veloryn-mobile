import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useTranslation } from 'react-i18next';
import { AppDrawerContent } from '@/components/shell/AppDrawerContent';

export default function AppDrawerLayout() {
  const { t } = useTranslation('common');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        drawerContent={(props: any) => <AppDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: '#7a24a1' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
          drawerType: 'front',
          drawerStyle: { width: 300 },
        }}
      >
        <Drawer.Screen
          name="dashboard"
          options={{ title: t('navigation.dashboard') }}
        />
        <Drawer.Screen
          name="(tabs)"
          options={{ headerShown: false, title: t('navigation.dashboard') }}
        />
        <Drawer.Screen
          name="modules/[slug]"
          options={{ title: '' }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
