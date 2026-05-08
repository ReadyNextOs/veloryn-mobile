import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Thread } from '@/types/messenger';
import { getDeterministicColor } from '@/lib/colors';

function getInitials(name: string | null): string {
  if (!name || name.trim().length === 0) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

interface Props {
  thread: Thread;
  size?: number;
}

export function ThreadAvatar({ thread, size = 42 }: Props) {
  const isDM = thread.type === 'direct';
  const displayName = isDM
    ? thread.participants?.[0]?.user?.display_name ?? thread.name ?? '?'
    : thread.name ?? '?';

  const initials = getInitials(displayName);
  const color = getDeterministicColor(thread.id);
  const radius = size / 2;

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: radius, backgroundColor: color },
      ]}
    >
      {isDM && (
        <View
          style={[
            styles.dmBadge,
            { bottom: -1, right: -1 },
          ]}
        />
      )}
      <Text style={[styles.initials, { fontSize: size * 0.33 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    color: '#fff',
    fontWeight: '600',
  },
  dmBadge: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#43a047',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
