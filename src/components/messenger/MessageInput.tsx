import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSendMessage, generateOptimisticId } from '@/hooks/messenger';
import { useTyping } from '@/hooks/messenger/useTyping';
import type { Message } from '@/types/messenger';

interface Props {
  threadId: string;
  onSend?: () => void;
  appendOptimisticMessage: (message: Message) => void;
  replaceOptimisticMessage: (tempId: string, serverMessage: Message) => void;
}

export function MessageInput({ threadId, onSend, appendOptimisticMessage, replaceOptimisticMessage }: Props) {
  const { t } = useTranslation('common');
  const [text, setText] = useState('');
  const sendMessage = useSendMessage();
  const { emitTyping, cancelTyping } = useTyping(threadId);
  const inputRef = useRef<TextInput>(null);

  const handleChangeText = useCallback((value: string) => {
    setText(value);
    if (value.trim().length > 0) {
      emitTyping();
    } else {
      cancelTyping();
    }
  }, [cancelTyping, emitTyping]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sendMessage.isPending) return;

    cancelTyping();
    setText('');

    const tempId = generateOptimisticId();

    sendMessage.mutate(
      {
        threadId,
        request: { body: trimmed },
        tempId,
      },
      {
        onSuccess: (serverMessage) => {
          replaceOptimisticMessage(tempId, serverMessage);
          onSend?.();
        },
      },
    );

    onSend?.();
  }, [cancelTyping, onSend, replaceOptimisticMessage, sendMessage, text, threadId]);

  const canSend = text.trim().length > 0 && !sendMessage.isPending;

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={handleChangeText}
        placeholder={t('messenger.message.inputPlaceholder')}
        placeholderTextColor="rgba(0,0,0,0.4)"
        multiline
        maxLength={4000}
        returnKeyType="default"
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[styles.sendBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.7}
        accessibilityLabel={t('messenger.message.send')}
      >
        <MaterialCommunityIcons
          name="send"
          size={20}
          color={canSend ? '#fff' : 'rgba(0,0,0,0.3)'}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.12)',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: 'rgba(0,0,0,0.87)',
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnActive: {
    backgroundColor: '#1976d2',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
