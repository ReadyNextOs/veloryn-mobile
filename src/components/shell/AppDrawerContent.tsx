import React, { useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/auth';
import { performLogout } from '@/lib/logout';
import {
  MODULE_GROUPS,
  MODULES,
  getModulesInGroup,
  getStandaloneModules,
  type ModuleConfig,
} from '@/config/modules';

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);

  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const trimmedSearch = search.trim().toLowerCase();

  const filterByLabel = (modules: ModuleConfig[]): ModuleConfig[] => {
    if (!trimmedSearch) return modules;
    return modules.filter((m) =>
      t(m.labelKey).toLowerCase().includes(trimmedSearch),
    );
  };

  const standalone = useMemo(
    () => filterByLabel(getStandaloneModules()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trimmedSearch, t],
  );

  const groupedModules = useMemo(
    () =>
      MODULE_GROUPS.map((group) => ({
        group,
        modules: filterByLabel(getModulesInGroup(group.key)),
      })).filter(({ modules }) => modules.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trimmedSearch, t],
  );

  const navigateToModule = (mod: ModuleConfig) => {
    props.navigation.closeDrawer();
    if (mod.hasNativeImpl && mod.nativeRoute) {
      router.push(mod.nativeRoute as never);
    } else {
      router.push(`/(app)/modules/${mod.slug}` as never);
    }
  };

  const navigateToDashboard = () => {
    props.navigation.closeDrawer();
    router.push('/(app)/dashboard');
  };

  const toggleGroup = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.account.logout'),
      t('settings.account.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.account.logoutConfirmYes'),
          style: 'destructive',
          onPress: () => {
            void performLogout({ revokeOnServer: true });
          },
        },
      ],
    );
  };

  const version = Constants.expoConfig?.version ?? '0.0.0';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandLetter}>V</Text>
          </View>
          <View style={styles.brandText}>
            <Text style={styles.brandName}>Veloryn</Text>
            {tenant?.name ? (
              <Text style={styles.brandTenant} numberOfLines={1}>
                {tenant.name}
              </Text>
            ) : null}
          </View>
        </View>
        {user?.display_name ? (
          <Text style={styles.userName} numberOfLines={1}>
            {user.display_name}
          </Text>
        ) : null}
      </View>

      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={18} color="rgba(0,0,0,0.4)" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('drawer.searchPlaceholder')}
          placeholderTextColor="rgba(0,0,0,0.4)"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Pressable style={styles.dashboardItem} onPress={navigateToDashboard}>
          <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#7a24a1" />
          <Text style={styles.dashboardLabel}>{t('navigation.dashboard')}</Text>
        </Pressable>

        {standalone.length > 0 && (
          <View style={styles.section}>
            {standalone.map((mod) => (
              <DrawerItem key={mod.slug} module={mod} onPress={navigateToModule} />
            ))}
          </View>
        )}

        {groupedModules.map(({ group, modules }) => {
          const collapsed = collapsedGroups[group.key] ?? false;
          return (
            <View key={group.key} style={styles.section}>
              <Pressable style={styles.groupHeader} onPress={() => toggleGroup(group.key)}>
                <View style={styles.groupHeaderLeft}>
                  <MaterialCommunityIcons
                    name={group.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={16}
                    color="rgba(0,0,0,0.5)"
                  />
                  <Text style={styles.groupTitle}>{t(group.labelKey)}</Text>
                </View>
                <MaterialCommunityIcons
                  name={collapsed ? 'chevron-down' : 'chevron-up'}
                  size={18}
                  color="rgba(0,0,0,0.35)"
                />
              </Pressable>
              {!collapsed &&
                modules.map((mod) => (
                  <DrawerItem key={mod.slug} module={mod} onPress={navigateToModule} />
                ))}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={18} color="#d32f2f" />
          <Text style={styles.logoutLabel}>{t('drawer.logout')}</Text>
        </Pressable>
        <Text style={styles.version}>
          {t('drawer.version')} {version}
        </Text>
      </View>
    </View>
  );
}

interface DrawerItemProps {
  module: ModuleConfig;
  onPress: (mod: ModuleConfig) => void;
}

const DrawerItem = React.memo(function DrawerItem({ module, onPress }: DrawerItemProps) {
  const { t } = useTranslation('common');
  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      onPress={() => onPress(module)}
    >
      <MaterialCommunityIcons
        name={module.icon as keyof typeof MaterialCommunityIcons.glyphMap}
        size={20}
        color="rgba(0,0,0,0.65)"
      />
      <Text style={styles.itemLabel} numberOfLines={1}>
        {t(module.labelKey)}
      </Text>
      {module.hasNativeImpl ? (
        <View style={styles.nativeBadge}>
          <Text style={styles.nativeBadgeText}>•</Text>
        </View>
      ) : null}
    </Pressable>
  );
});

// Suppress unused warning — MODULES export consumed elsewhere
void MODULES;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#7a24a1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  brandText: {
    flex: 1,
    minWidth: 0,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.87)',
  },
  brandTenant: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.55)',
  },
  userName: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(0,0,0,0.87)',
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  dashboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(122,36,161,0.06)',
    marginHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  dashboardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7a24a1',
  },
  section: {
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  itemPressed: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(0,0,0,0.85)',
  },
  nativeBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#43a047',
  },
  nativeBadgeText: {
    fontSize: 0,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d32f2f',
  },
  version: {
    marginTop: 6,
    fontSize: 11,
    color: 'rgba(0,0,0,0.35)',
  },
});
