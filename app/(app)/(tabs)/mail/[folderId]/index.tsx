import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMailMessages } from '@/hooks/mail/useMailMessages';
import { useMarkRead } from '@/hooks/mail/useMarkRead';
import { useToggleFlag } from '@/hooks/mail/useToggleFlag';
import { MailListItemComponent } from '@/components/mail/MailListItem';
import { MailMessageSkeleton } from '@/components/mail/MailMessageSkeleton';
import type { MailListItem, MailListParams } from '@/types/mail';
import { useLayoutEffect } from 'react';

export default function MailFolderScreen() {
  const { t } = useTranslation('common');
  const { folderId, accountId, folderName } = useLocalSearchParams<{
    folderId: string;
    accountId: string;
    folderName?: string;
  }>();
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterStarred, setFilterStarred] = useState(false);
  const [filterAttachments, setFilterAttachments] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer na unmount — zapobiega state update po odmontowaniu
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({ title: folderName ?? t('tabs.mail') });
  }, [navigation, folderName, t]);

  const filters: Omit<MailListParams, 'page'> = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      unread: filterUnread || undefined,
      flagged: filterStarred || undefined,
      has_attachments: filterAttachments || undefined,
    }),
    [debouncedSearch, filterUnread, filterStarred, filterAttachments],
  );

  const { data, isLoading, isError, error, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } =
    useMailMessages({
      accountId: accountId ?? null,
      folderId: folderId ?? null,
      filters,
    });

  useEffect(() => {
    if (isError && __DEV__) {
      console.warn('[mail][folder]', error);
    }
  }, [isError, error]);

  const { mutate: markRead } = useMarkRead();
  const { mutate: toggleFlag } = useToggleFlag();

  const allMessages = useMemo(
    () => (data?.pages ?? []).flat(),
    [data],
  );

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(text), 500);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handlePress = useCallback(
    (item: MailListItem) => {
      if (!accountId || !folderId) return;
      router.push({
        pathname: '/(app)/(tabs)/mail/[folderId]/[messageId]',
        params: {
          folderId,
          messageId: item.id,
          accountId,
          subject: item.subject,
        },
      });
    },
    [accountId, folderId],
  );

  const handleLongPress = useCallback(
    (item: MailListItem) => {
      if (!accountId || !folderId) return;
      const readLabel = item.is_read
        ? t('mail.actions.markUnread')
        : t('mail.actions.markRead');
      const starLabel = item.is_starred
        ? t('mail.detail.unstar')
        : t('mail.detail.star');

      Alert.alert('', '', [
        {
          text: readLabel,
          onPress: () =>
            markRead({
              accountId,
              folderId,
              messageIds: [item.id],
              isRead: !item.is_read,
            }),
        },
        {
          text: starLabel,
          onPress: () =>
            toggleFlag({
              accountId,
              folderId,
              messageIds: [item.id],
              newStarred: !item.is_starred,
            }),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    },
    [accountId, folderId, markRead, toggleFlag, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: MailListItem }) => (
      <MailListItemComponent
        item={item}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
      />
    ),
    [handlePress, handleLongPress],
  );

  const keyExtractor = useCallback((item: MailListItem) => item.id, []);

  function ChipFilter({
    label,
    active,
    onToggle,
  }: {
    label: string;
    active: boolean;
    onToggle: () => void;
  }) {
    return (
      <TouchableOpacity
        style={[styles.chip, active && styles.chipActive]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={18} color="rgba(0,0,0,0.4)" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('mail.list.searchPlaceholder')}
          placeholderTextColor="rgba(0,0,0,0.4)"
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Quick filters */}
      <View style={styles.chips}>
        <ChipFilter
          label={t('mail.list.unread')}
          active={filterUnread}
          onToggle={() => setFilterUnread((v) => !v)}
        />
        <ChipFilter
          label={t('mail.list.starred')}
          active={filterStarred}
          onToggle={() => setFilterStarred((v) => !v)}
        />
        <ChipFilter
          label={t('mail.list.attachments')}
          active={filterAttachments}
          onToggle={() => setFilterAttachments((v) => !v)}
        />
      </View>

      {isLoading && allMessages.length === 0 ? (
        <MailMessageSkeleton />
      ) : isError && allMessages.length === 0 ? (
        <View style={styles.errorCenter}>
          <MaterialCommunityIcons name="email-alert-outline" size={48} color="rgba(0,0,0,0.25)" />
          <Text style={styles.errorTitle}>{t('mail.errors.loadFailed')}</Text>
          <Text style={styles.errorDescription}>
            {error instanceof Error && error.message
              ? error.message
              : t('mail.errors.loadFailedDescription')}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void refetch()}
            activeOpacity={0.75}
          >
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={allMessages}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={isLoading && !isFetchingNextPage} onRefresh={() => void refetch()} />
          }
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <MaterialCommunityIcons name="email-open-outline" size={48} color="rgba(0,0,0,0.2)" />
              <Text style={styles.emptyText}>{t('mail.list.empty')}</Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('common.loading')}</Text>
              </View>
            ) : null
          }
          contentContainerStyle={allMessages.length === 0 ? styles.flex : undefined}
        />
      )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(0,0,0,0.87)',
    paddingVertical: 0,
  },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  chipActive: {
    backgroundColor: '#7a24a1',
    borderColor: '#7a24a1',
  },
  chipText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 12,
    textAlign: 'center',
  },
  errorCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.87)',
    marginTop: 12,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.55)',
    marginTop: 6,
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#7a24a1',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.4)',
  },
});
