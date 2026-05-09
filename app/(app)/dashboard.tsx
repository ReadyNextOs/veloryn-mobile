import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import {
  MODULE_GROUPS,
  getModulesInGroup,
  type ModuleConfig,
} from '@/config/modules';
import { ModuleGroupSection } from '@/components/shell/ModuleGroupSection';
import { ModuleTile } from '@/components/shell/ModuleTile';

const SHORTCUT_SLUGS = ['mail', 'messenger', 'documents', 'calendar'];

function getGreetingKey(): 'morning' | 'afternoon' | 'evening' | 'default' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'default';
}

export default function DashboardScreen() {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);

  const greetingKey = useMemo(() => getGreetingKey(), []);

  const handleModulePress = useCallback((mod: ModuleConfig) => {
    if (mod.hasNativeImpl && mod.nativeRoute) {
      router.push(mod.nativeRoute as never);
    } else {
      router.push(`/(app)/modules/${mod.slug}` as never);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const shortcuts = useMemo(() => {
    const all = MODULE_GROUPS.flatMap((g) => getModulesInGroup(g.key));
    return SHORTCUT_SLUGS.map((slug) => all.find((m) => m.slug === slug)).filter(
      (m): m is ModuleConfig => m !== undefined,
    );
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.hero}>
        <Text style={styles.greeting}>
          {t(`dashboard.greeting.${greetingKey}`)}
          {user?.first_name ? `, ${user.first_name}` : ''}
        </Text>
        <Text style={styles.heroSub}>{t('dashboard.allModules')}</Text>
      </View>

      {shortcuts.length > 0 && (
        <View style={styles.shortcutsSection}>
          <Text style={styles.shortcutsTitle}>{t('dashboard.shortcuts')}</Text>
          <View style={styles.shortcutsRow}>
            {shortcuts.map((mod) => (
              <ModuleTile key={mod.slug} module={mod} onPress={handleModulePress} />
            ))}
          </View>
        </View>
      )}

      {MODULE_GROUPS.map((group) => (
        <ModuleGroupSection
          key={group.key}
          group={group}
          modules={getModulesInGroup(group.key)}
          onModulePress={handleModulePress}
        />
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    paddingTop: 8,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.87)',
  },
  heroSub: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
  },
  shortcutsSection: {
    marginBottom: 16,
  },
  shortcutsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.7)',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  shortcutsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  bottomSpacer: {
    height: 24,
  },
});
