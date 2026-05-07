import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Reaction } from '@/types/messenger';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  currentReactions: Reaction[];
}

export function EmojiPicker({ onSelect, onClose, currentReactions }: Props) {
  const reactedEmojis = new Set(
    currentReactions.filter((r) => r.reacted).map((r) => r.emoji),
  );

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.picker}>
          {QUICK_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiBtn,
                reactedEmojis.has(emoji) && styles.emojiBtnActive,
              ]}
              onPress={() => onSelect(emoji)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picker: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 6,
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emojiBtnActive: {
    backgroundColor: '#e3f2fd',
  },
  emojiText: {
    fontSize: 24,
  },
});
