import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMessengerStore } from '@/store/messenger';

interface Props {
  threadId: string;
}

const TTL_MS = 6000;
const MAX_NAMES = 3;

export function TypingIndicator({ threadId }: Props) {
  const { t } = useTranslation('common');
  const typingByThread = useMessengerStore((s) => s.typingByThread);
  const removeExpired = useMessengerStore((s) => s.removeExpiredTyping);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      removeExpired(threadId);
    }, 1000);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [removeExpired, threadId]);

  const typingUsers = typingByThread.get(threadId) ?? [];
  const activeUsers = typingUsers.filter((u) => u.expiresAt > Date.now());

  if (activeUsers.length === 0) return null;

  const shownUsers = activeUsers.slice(0, MAX_NAMES);
  const extraCount = activeUsers.length - shownUsers.length;

  let names = shownUsers.map((u) => u.displayName).join(', ');
  if (extraCount > 0) {
    names = `${names} ${t('messenger.thread.typingOthers', { count: extraCount })}`;
  }

  const verb = activeUsers.length === 1
    ? t('messenger.thread.typing')
    : t('messenger.thread.typingMultiple');

  return (
    <View style={styles.container}>
      <Text style={styles.text} numberOfLines={1}>
        {names} {verb}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    fontStyle: 'italic',
  },
});
