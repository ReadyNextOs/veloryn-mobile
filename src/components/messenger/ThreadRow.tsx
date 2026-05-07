import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDistance } from 'date-fns';
import { pl as dateFnsPl } from 'date-fns/locale';
import type { Thread } from '@/types/messenger';
import { ThreadAvatar } from './ThreadAvatar';

interface Props {
  thread: Thread;
  onPress: (thread: Thread) => void;
  onLongPress: (thread: Thread) => void;
}

function formatRelativeDate(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 1) {
      return formatDistance(date, now, { addSuffix: false, locale: dateFnsPl });
    }
    if (diffDays < 2) return 'wczoraj';
    const day = date.getDate();
    const monthNames = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
    return `${day} ${monthNames[date.getMonth()] ?? ''}`;
  } catch {
    return '';
  }
}

export const ThreadRow = React.memo(function ThreadRow({ thread, onPress, onLongPress }: Props) {
  const hasUnread = thread.unread_count > 0;

  const handlePress = useCallback(() => onPress(thread), [onPress, thread]);
  const handleLongPress = useCallback(() => onLongPress(thread), [onLongPress, thread]);

  const displayName = thread.name
    ?? (thread.type === 'direct' && thread.participants?.[0]?.user.display_name)
    ?? 'Rozmowa';

  const lastMsg = thread.last_message;
  const previewText = lastMsg
    ? `${lastMsg.author_display_name}: ${lastMsg.body_preview}`
    : null;

  const dateStr = formatRelativeDate(thread.last_activity_at);

  return (
    <TouchableOpacity
      style={[styles.row, hasUnread && styles.rowUnread]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.75}
    >
      <ThreadAvatar thread={thread} size={44} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, hasUnread && styles.nameUnread]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        {previewText ? (
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {previewText}
          </Text>
        ) : null}
      </View>

      {hasUnread && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {thread.unread_count > 99 ? '99+' : String(thread.unread_count)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  rowUnread: {
    backgroundColor: '#e8f0fe',
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    marginRight: 8,
  },
  nameUnread: {
    color: 'rgba(0,0,0,0.87)',
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    flexShrink: 0,
  },
  preview: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
  },
  previewUnread: {
    color: 'rgba(0,0,0,0.7)',
    fontWeight: '500',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginLeft: 8,
    flexShrink: 0,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
