import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMailMessage } from '@/hooks/mail/useMailMessage';
import { useMarkRead } from '@/hooks/mail/useMarkRead';
import { useToggleFlag } from '@/hooks/mail/useToggleFlag';
import { AttachmentRow } from '@/components/mail/AttachmentRow';
import type { EmailAddress } from '@/types/mail';

function formatFullDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function AddressLine({ label, addresses }: { label: string; addresses: EmailAddress[] }) {
  if (addresses.length === 0) return null;
  const text = addresses.map((a) => a.display ?? a.name ?? a.email).join(', ');
  return (
    <View style={styles.addrRow}>
      <Text style={styles.addrLabel}>{label}: </Text>
      <Text style={styles.addrValue} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

export default function MessageDetailScreen() {
  const { t } = useTranslation('common');
  const { folderId, messageId, accountId, subject } = useLocalSearchParams<{
    folderId: string;
    messageId: string;
    accountId: string;
    subject?: string;
  }>();
  const navigation = useNavigation();

  const { data: message, isLoading, isError } = useMailMessage(
    accountId ?? null,
    folderId ?? null,
    messageId ?? null,
  );

  const { mutate: markRead } = useMarkRead();
  const { mutate: toggleFlag } = useToggleFlag();

  const [recipientsExpanded, setRecipientsExpanded] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: subject ?? message?.subject ?? '',
      headerRight: () =>
        message ? (
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleToggleStar}
              style={styles.headerBtn}
            >
              <MaterialCommunityIcons
                name={message.is_starred ? 'star' : 'star-outline'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMarkUnread}
              style={styles.headerBtn}
            >
              <MaterialCommunityIcons
                name="email-mark-as-unread"
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        ) : null,
    });
  }, [navigation, subject, message]);

  // Auto mark as read on mount
  useEffect(() => {
    if (message && !message.is_read && accountId && folderId) {
      markRead({ accountId, folderId, messageIds: [message.id], isRead: true });
    }
  }, [message?.id, message?.is_read]);

  const handleMarkUnread = useCallback(() => {
    if (!message || !accountId || !folderId) return;
    markRead({ accountId, folderId, messageIds: [message.id], isRead: false });
  }, [message, accountId, folderId, markRead]);

  const handleToggleStar = useCallback(() => {
    if (!message || !accountId || !folderId) return;
    toggleFlag({
      accountId,
      folderId,
      messageIds: [message.id],
      newStarred: !message.is_starred,
    });
  }, [message, accountId, folderId, toggleFlag]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (isError || !message) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('mail.errors.loadFailed')}</Text>
      </View>
    );
  }

  const nonInlineAttachments = message.attachments.filter((a) => !a.is_inline);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Subject */}
      <Text style={styles.subject}>{message.subject}</Text>

      {/* Sender */}
      <View style={styles.senderSection}>
        <View style={styles.senderInfo}>
          <Text style={styles.senderName}>
            {message.from.name ?? message.from.email}
          </Text>
          <Text style={styles.senderEmail}>{`<${message.from.email}>`}</Text>
        </View>
        <Text style={styles.dateText}>{formatFullDate(message.received_at)}</Text>
      </View>

      {/* Recipients (collapsible) */}
      <TouchableOpacity
        onPress={() => setRecipientsExpanded((v) => !v)}
        style={styles.recipientsToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.recipientsToggleText}>
          {recipientsExpanded ? t('mail.detail.to') + ':' : `${t('mail.detail.to')}: ${message.to.map((a) => a.name ?? a.email).join(', ')}`}
        </Text>
        <MaterialCommunityIcons
          name={recipientsExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="rgba(0,0,0,0.4)"
        />
      </TouchableOpacity>

      {recipientsExpanded && (
        <View style={styles.recipientsDetails}>
          <AddressLine label={t('mail.detail.to')} addresses={message.to} />
          <AddressLine label={t('mail.detail.cc')} addresses={message.cc} />
          <AddressLine label={t('mail.detail.bcc')} addresses={message.bcc} />
        </View>
      )}

      {/* Body */}
      {/* Fixed height z scroll wewnątrz WebView — auto-height wymagałby JS, co
          łamie security spec (D5: javaScriptEnabled=false). Sprint 3+ rozważy
          react-native-render-html dla parsed HTML bez WebView. */}
      <View style={styles.bodyContainer}>
        {message.body_html ? (
          <WebView
            source={{
              html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; font-size: 16px; line-height: 1.5; padding: 12px; margin: 0; color: #212121; word-wrap: break-word; }
  img { max-width: 100%; height: auto; display: block; }
  a { color: #1976d2; }
  table { max-width: 100%; }
  pre, code { white-space: pre-wrap; word-wrap: break-word; overflow-x: auto; }
</style></head><body>${message.body_html}</body></html>`,
            }}
            originWhitelist={['http://*', 'https://*']}
            javaScriptEnabled={false}
            mixedContentMode="never"
            scrollEnabled={true}
            style={styles.webView}
          />
        ) : (
          <Text style={styles.bodyText}>{message.body_text ?? ''}</Text>
        )}
      </View>

      {/* Attachments */}
      {nonInlineAttachments.length > 0 && (
        <View style={styles.attachmentsSection}>
          <Text style={styles.attachmentsTitle}>
            {`Załączniki (${nonInlineAttachments.length})`}
          </Text>
          {nonInlineAttachments.map((att) => (
            <AttachmentRow key={att.id} attachment={att} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.5)',
  },
  errorText: {
    fontSize: 15,
    color: '#d32f2f',
    textAlign: 'center',
  },
  subject: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.87)',
    padding: 16,
    paddingBottom: 8,
  },
  senderSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.87)',
  },
  senderEmail: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 1,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginLeft: 8,
    flexShrink: 0,
  },
  recipientsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  recipientsToggleText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
  },
  recipientsDetails: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fafafa',
  },
  addrRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  addrLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.5)',
  },
  addrValue: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(0,0,0,0.7)',
  },
  bodyContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 4,
    height: 600,
  },
  webView: {
    height: 600,
    backgroundColor: 'white',
  },
  bodyText: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.87)',
    lineHeight: 22,
    padding: 16,
  },
  attachmentsSection: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  attachmentsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
  },
  headerActions: {
    flexDirection: 'row',
    marginRight: 4,
  },
  headerBtn: {
    padding: 8,
  },
});
