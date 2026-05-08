import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Reaction } from '@/types/messenger';

interface Props {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
  isOwn: boolean;
}

export function ReactionBar({ reactions, onToggle, isOwn }: Props) {
  if (reactions.length === 0) return null;

  return (
    <View style={[styles.bar, isOwn ? styles.barRight : styles.barLeft]}>
      {reactions.map((reaction) => (
        <TouchableOpacity
          key={reaction.emoji}
          style={[styles.bubble, reaction.reacted && styles.bubbleActive]}
          onPress={() => onToggle(reaction.emoji)}
          activeOpacity={0.75}
        >
          <Text style={styles.emoji}>{reaction.emoji}</Text>
          {reaction.count > 1 && (
            <Text style={[styles.count, reaction.reacted && styles.countActive]}>
              {reaction.count}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 3,
    gap: 4,
  },
  barLeft: {
    justifyContent: 'flex-start',
  },
  barRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  bubbleActive: {
    backgroundColor: '#f3e5f7',
    borderColor: '#7a24a1',
  },
  emoji: {
    fontSize: 13,
  },
  count: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.6)',
    marginLeft: 3,
    fontWeight: '600',
  },
  countActive: {
    color: '#7a24a1',
  },
});
