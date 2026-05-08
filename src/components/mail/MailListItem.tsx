import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistance } from 'date-fns';
import { pl } from 'date-fns/locale';
import type { MailListItem } from '@/types/mail';
import { getDeterministicColor } from '@/lib/colors';

interface Props {
  item: MailListItem;
  onPress: () => void;
  onLongPress: () => void;
}

function getInitials(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatRelativeDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 1) {
      return formatDistance(date, now, { addSuffix: false, locale: pl });
    }
    if (diffDays < 2) {
      return 'wczoraj';
    }
    const day = date.getDate();
    const monthNames = [
      'sty', 'lut', 'mar', 'kwi', 'maj', 'cze',
      'lip', 'sie', 'wrz', 'paź', 'lis', 'gru',
    ];
    return `${day} ${monthNames[date.getMonth()] ?? ''}`;
  } catch {
    return '';
  }
}

export function MailListItemComponent({ item, onPress, onLongPress }: Props) {
  const initials = getInitials(item.from.name, item.from.email);
  const avatarColor = getDeterministicColor(item.from.email);
  const relativeDate = formatRelativeDate(item.received_at);
  const senderName = item.from.name ?? item.from.email;

  return (
    <TouchableOpacity
      style={[styles.row, !item.is_read && styles.rowUnread]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            style={[styles.sender, !item.is_read && styles.senderUnread]}
            numberOfLines={1}
          >
            {senderName}
          </Text>
          <Text style={styles.date}>{relativeDate}</Text>
        </View>
        <Text
          style={[styles.subject, !item.is_read && styles.subjectUnread]}
          numberOfLines={1}
        >
          {item.subject}
        </Text>
        <View style={styles.bottomRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {item.preview}
          </Text>
          <View style={styles.icons}>
            {item.has_attachments && (
              <MaterialCommunityIcons
                name="paperclip"
                size={14}
                color="rgba(0,0,0,0.4)"
              />
            )}
            {item.is_starred && (
              <MaterialCommunityIcons
                name="star"
                size={14}
                color="#f57c00"
                style={styles.iconStar}
              />
            )}
          </View>
        </View>
      </View>

      {/* Unread dot */}
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

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
    backgroundColor: '#f3e5f7',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sender: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    marginRight: 8,
  },
  senderUnread: {
    color: 'rgba(0,0,0,0.87)',
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    flexShrink: 0,
  },
  subject: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 2,
  },
  subjectUnread: {
    color: 'rgba(0,0,0,0.87)',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  iconStar: {
    marginLeft: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7a24a1',
    marginLeft: 8,
    flexShrink: 0,
  },
});
