import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMailAccounts } from '@/hooks/mail/useMailAccounts';
import { useMailFolders } from '@/hooks/mail/useMailFolders';
import { MailFolderRow } from '@/components/mail/MailFolderRow';
import { MailFolderSkeleton } from '@/components/mail/MailFolderSkeleton';
import type { MailFolder } from '@/types/mail';

export default function MailIndex() {
  const { t } = useTranslation('common');

  const {
    data: accounts,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    derivedError,
    refetch: refetchAccounts,
  } = useMailAccounts();

  const firstAccountId = accounts?.[0]?.id ?? null;

  const {
    data: folders,
    isLoading: isLoadingFolders,
    isError: isErrorFolders,
    refetch: refetchFolders,
  } = useMailFolders(firstAccountId);

  const visibleFolders = useMemo(
    () =>
      (folders ?? [])
        .filter((f) => !f.is_excluded && f.is_visible)
        .sort((a, b) => a.priority - b.priority),
    [folders],
  );

  const isLoading = isLoadingAccounts || isLoadingFolders;
  const isError = isErrorAccounts || isErrorFolders;

  const onRefresh = useCallback(() => {
    void refetchAccounts();
    void refetchFolders();
  }, [refetchAccounts, refetchFolders]);

  const getFolderLabel = useCallback(
    (folder: MailFolder): string => {
      if (folder.type !== 'custom') {
        return t(`mail.folders.${folder.type}`);
      }
      return folder.name;
    },
    [t],
  );

  const handleFolderPress = useCallback(
    (folder: MailFolder) => {
      if (!firstAccountId) return;
      router.push({
        pathname: '/(tabs)/mail/[folderId]/index',
        params: {
          folderId: folder.id,
          accountId: firstAccountId,
          folderName: getFolderLabel(folder),
        },
      });
    },
    [firstAccountId, t, getFolderLabel],
  );

  const keyExtractor = useCallback((item: MailFolder) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: MailFolder }) => (
      <MailFolderRow
        folder={item}
        folderLabel={getFolderLabel(item)}
        onPress={() => handleFolderPress(item)}
      />
    ),
    [getFolderLabel, handleFolderPress],
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <MailFolderSkeleton />
      </View>
    );
  }

  if (derivedError) {
    const errorMessage =
      derivedError === 'MAIL_NOT_CONFIGURED'
        ? t('mail.errors.notConfigured')
        : derivedError === 'NO_MAIL_ACCOUNTS'
          ? t('mail.errors.noAccounts')
          : t('mail.errors.networkError');
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        {derivedError === 'NETWORK_ERROR' && (
          <Text style={styles.retryText} onPress={onRefresh}>
            {t('common.retry')}
          </Text>
        )}
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('mail.errors.loadFailed')}</Text>
        <Text style={styles.retryText} onPress={onRefresh}>
          {t('common.retry')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={visibleFolders}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>{t('mail.list.empty')}</Text>
          </View>
        }
        contentContainerStyle={visibleFolders.length === 0 ? styles.flex : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
});
