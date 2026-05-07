import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThreads } from '@/hooks/messenger';
import { ThreadRow } from '@/components/messenger/ThreadRow';
import { ThreadListSkeleton } from '@/components/messenger/ThreadListSkeleton';
import type { Thread } from '@/types/messenger';

export default function MessengerIndex() {
  const { t } = useTranslation('common');
  const { data: threads, isLoading, isError, refetch, isFetching } = useThreads();

  const handlePress = useCallback((thread: Thread) => {
    router.push({
      pathname: '/(tabs)/messenger/[threadId]',
      params: { threadId: thread.id },
    });
  }, []);

  const handleLongPress = useCallback((_thread: Thread) => {
    // Sprint 4: opcje wątku (long-press menu)
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ThreadListSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="rgba(0,0,0,0.3)" />
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <Text style={styles.retryText} onPress={() => void refetch()}>
          {t('common.retry')}
        </Text>
      </View>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="message-text-outline" size={64} color="rgba(0,0,0,0.2)" />
        <Text style={styles.emptyTitle}>{t('messenger.threads.empty')}</Text>
        <Text style={styles.emptySubtitle}>{t('messenger.threads.emptySubtitle')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ThreadRow
            thread={item}
            onPress={handlePress}
            onLongPress={handleLongPress}
          />
        )}
        onRefresh={refetch}
        refreshing={isFetching && !isLoading}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.6)',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 6,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 12,
  },
  retryText: {
    fontSize: 14,
    color: '#1976d2',
    marginTop: 8,
  },
});
