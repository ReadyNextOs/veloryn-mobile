// Thread detail screen — implementacja w RN-017/RN-018
// Plik tworzony w RN-016 jako route stub

import React, { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMessages, useMarkThreadRead, useSubscription } from '@/hooks/messenger';
import { MessageBubble } from '@/components/messenger/MessageBubble';
import { MessageInput } from '@/components/messenger/MessageInput';
import { MessageListSkeleton } from '@/components/messenger/MessageListSkeleton';
import { TypingIndicator } from '@/components/messenger/TypingIndicator';
import { useMessengerSocket } from '@/hooks/messenger/useMessengerSocket';
import { useThreads } from '@/hooks/messenger/useThreads';
import type { Message } from '@/types/messenger';

export default function ThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { t } = useTranslation('common');

  const threads = useThreads();
  const thread = threads.data?.find((th) => th.id === threadId);

  const {
    allMessages,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMessages(threadId ?? null);

  const markRead = useMarkThreadRead();
  const subscription = useSubscription();
  const flatListRef = useRef<FlatList<Message>>(null);

  // Subscribe to WebSocket for this thread
  useMessengerSocket(threadId ?? null);

  // Mark thread read on mount
  useEffect(() => {
    if (threadId) {
      markRead.mutate(threadId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const handleLoadOlder = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleScrollToBottom = useCallback(() => {
    if (allMessages.length > 0) {
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    }
  }, [allMessages.length]);

  const isMuted = thread?.subscription?.level === 'off';

  const handleToggleMute = useCallback(() => {
    if (!threadId) return;
    const nextLevel = isMuted ? 'all' : 'off';
    subscription.mutate({ threadId, level: nextLevel });
  }, [isMuted, subscription, threadId]);

  const threadName = thread?.name
    ?? (thread?.type === 'direct' && thread.participants?.[0]?.user.display_name)
    ?? t('tabs.messenger');

  if (!threadId) {
    return (
      <View style={styles.centered}>
        <Text>{t('messenger.errors.threadNotFound')}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: String(threadName),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleToggleMute}
              style={styles.headerBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name={isMuted ? 'bell-off-outline' : 'bell-outline'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <MessageListSkeleton />
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{t('messenger.errors.loadFailed')}</Text>
            <Text style={styles.retryText} onPress={() => void refetch()}>
              {t('common.retry')}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={allMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} threadId={threadId} />
            )}
            inverted
            onEndReached={handleLoadOlder}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isFetchingNextPage ? (
                <Text style={styles.loadingOlder}>{t('messenger.thread.loadOlder')}</Text>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyText}>{t('messenger.thread.noMessages')}</Text>
              </View>
            }
            contentContainerStyle={styles.messageList}
          />
        )}

        <TypingIndicator threadId={threadId} />

        <MessageInput
          threadId={threadId}
          onSend={handleScrollToBottom}
        />
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  headerBtn: {
    marginRight: 8,
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#1976d2',
    marginTop: 8,
  },
  messageList: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
  },
  loadingOlder: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
  },
});
