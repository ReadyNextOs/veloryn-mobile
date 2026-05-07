import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDistance } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { getDateFnsLocale } from '@/lib/dateFnsLocale';
import { useAuthStore } from '@/store/auth';
import { useToggleReaction } from '@/hooks/messenger';
import type { Message, Reaction } from '@/types/messenger';
import { ReactionBar } from './ReactionBar';
import { EmojiPicker } from './EmojiPicker';

interface Props {
  message: Message;
  threadId: string;
}

const AVATAR_COLORS = ['#1976d2', '#388e3c', '#7b1fa2', '#f57c00', '#c62828'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? '#1976d2';
}

function getInitials(name: string | undefined): string {
  if (!name || name.trim().length === 0) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

const isOptimistic = (id: string): boolean => id.startsWith('__optimistic_');
const isFailed = (id: string): boolean => id.includes('__failed');

export const MessageBubble = React.memo(function MessageBubble({ message, threadId }: Props) {
  const { t, i18n } = useTranslation('common');
  const locale = getDateFnsLocale(i18n.language);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const toggleReaction = useToggleReaction();
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  const isOwn = message.author_id === currentUserId;
  const isPending = isOptimistic(message.id);
  const isSendFailed = isFailed(message.id);

  const authorName = message.author?.display_name ?? t('common.error');
  const avatarColor = getAvatarColor(message.author_id);
  const initials = getInitials(message.author?.display_name);

  let dateStr = '';
  try {
    dateStr = formatDistance(new Date(message.created_at), new Date(), {
      addSuffix: false,
      locale,
    });
  } catch {
    dateStr = '';
  }

  const handleLongPress = useCallback(() => {
    if (!isPending && !isSendFailed) {
      setShowEmojiPicker(true);
    }
  }, [isPending, isSendFailed]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setShowEmojiPicker(false);
    toggleReaction.mutate({ threadId, messageId: message.id, emoji });
  }, [message.id, threadId, toggleReaction]);

  if (message.is_deleted) {
    return (
      <View style={[styles.row, isOwn ? styles.rowRight : styles.rowLeft]}>
        <Text style={styles.deletedText}>{t('messenger.message.deleted')}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.row, isOwn ? styles.rowRight : styles.rowLeft]}>
        {!isOwn && (
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}

        <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
          {!isOwn && (
            <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
          )}

          <TouchableOpacity
            onLongPress={handleLongPress}
            activeOpacity={0.85}
            style={[
              styles.bubble,
              isOwn ? styles.bubbleOwn : styles.bubbleOther,
              isSendFailed && styles.bubbleFailed,
              isPending && styles.bubblePending,
            ]}
          >
            <Text style={[styles.bodyText, isOwn ? styles.bodyOwn : styles.bodyOther]}>
              {message.body}
            </Text>
          </TouchableOpacity>

          {message.reactions.length > 0 && (
            <ReactionBar
              reactions={message.reactions}
              onToggle={(emoji) => handleEmojiSelect(emoji)}
              isOwn={isOwn}
            />
          )}

          <View style={[styles.meta, isOwn ? styles.metaRight : styles.metaLeft]}>
            {message.is_edited && (
              <Text style={styles.editedLabel}>{t('messenger.message.edited')}</Text>
            )}
            {isPending && (
              <Text style={styles.pendingLabel}>•••</Text>
            )}
            {isSendFailed && (
              <Text style={styles.failedLabel}>{t('messenger.message.sendFailed')}</Text>
            )}
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
        </View>
      </View>

      {showEmojiPicker && (
        <EmojiPicker
          onSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
          currentReactions={message.reactions}
        />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
    marginBottom: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  bubbleWrapper: {
    maxWidth: '75%',
  },
  bubbleWrapperLeft: {
    alignItems: 'flex-start',
  },
  bubbleWrapperRight: {
    alignItems: 'flex-end',
  },
  authorName: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.5)',
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleOwn: {
    backgroundColor: '#1976d2',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  bubbleFailed: {
    opacity: 0.6,
    borderColor: '#d32f2f',
    borderWidth: 1,
  },
  bubblePending: {
    opacity: 0.6,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bodyOwn: {
    color: '#fff',
  },
  bodyOther: {
    color: 'rgba(0,0,0,0.87)',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  metaLeft: {
    justifyContent: 'flex-start',
    paddingLeft: 4,
  },
  metaRight: {
    justifyContent: 'flex-end',
    paddingRight: 4,
  },
  dateText: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
  },
  editedLabel: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
  },
  pendingLabel: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.3)',
  },
  failedLabel: {
    fontSize: 10,
    color: '#d32f2f',
  },
  deletedText: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.35)',
    fontStyle: 'italic',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
