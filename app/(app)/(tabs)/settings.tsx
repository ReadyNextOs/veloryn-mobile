import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { performLogout } from '@/lib/logout';
import { useBiometricUnlock } from '@/hooks/useBiometricUnlock';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { DevicesList } from '@/components/settings/DevicesList';
import { LanguagePicker } from '@/components/settings/LanguagePicker';

const PRIVACY_POLICY_URL = 'https://veloryn.pl/privacy';

export default function SettingsScreen() {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const { isAvailable: biometricAvailable } = useBiometricUnlock();

  const handleLogout = useCallback(() => {
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
  }, [t]);

  const handlePrivacyPolicy = useCallback(() => {
    void Linking.openURL(PRIVACY_POLICY_URL);
  }, []);

  const appVersion = Constants.expoConfig?.version ?? '—';

  const userInitials = user?.display_name
    ? user.display_name
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Account header */}
      <View style={styles.accountHeader}>
        <View style={styles.accountAvatar}>
          <Text style={styles.accountInitials}>{userInitials}</Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName} numberOfLines={1}>
            {user?.display_name ?? '—'}
          </Text>
          <Text style={styles.accountEmail} numberOfLines={1}>
            {user?.email ?? '—'}
          </Text>
          {tenant ? (
            <Text style={styles.accountTenant} numberOfLines={1}>
              {tenant.name}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Account section */}
      <SettingsSection title={t('settings.account.title')}>
        <SettingsRow
          variant="destructive"
          label={t('settings.account.logout')}
          icon="logout"
          onPress={handleLogout}
          isLast
        />
      </SettingsSection>

      {/* Notifications — preferencje per-typ pojawią się w Sprint 4. */}
      <SettingsSection title={t('settings.notifications.title')}>
        <SettingsRow
          variant="info"
          label={t('settings.notifications.permissionHint')}
        />
        <SettingsRow
          variant="info"
          label={t('settings.notifications.preferencesComingSoon')}
          isLast
        />
      </SettingsSection>

      {/* Devices */}
      <SettingsSection title={t('settings.devices.title')}>
        <DevicesList />
      </SettingsSection>

      {/* Language */}
      <SettingsSection title={t('settings.language.title')}>
        <LanguagePicker />
      </SettingsSection>

      {/* Biometrics — przełącznik enable/disable pojawi się w Sprint 4.
          Obecnie biometria jest aktywna automatycznie gdy hardware dostępny. */}
      <SettingsSection title={t('settings.biometric.title')}>
        {biometricAvailable ? (
          <SettingsRow
            variant="info"
            label={t('settings.biometric.activeStatus')}
            sublabel={t('settings.biometric.toggleComingSoon')}
            icon="fingerprint"
            isLast
          />
        ) : (
          <SettingsRow
            variant="info"
            label={t('settings.biometric.unavailable')}
            isLast
          />
        )}
      </SettingsSection>

      {/* About */}
      <SettingsSection title={t('settings.about.title')}>
        <SettingsRow
          variant="info"
          label={t('settings.about.version')}
          value={appVersion}
          icon="information-outline"
        />
        <SettingsRow
          variant="navigation"
          label={t('settings.about.privacyPolicy')}
          icon="shield-account-outline"
          onPress={handlePrivacyPolicy}
          isLast
        />
      </SettingsSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  accountAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#7a24a1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  accountInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.87)',
  },
  accountEmail: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 2,
  },
  accountTenant: {
    fontSize: 12,
    color: '#7a24a1',
    marginTop: 2,
  },
});
