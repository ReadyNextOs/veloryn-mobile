import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';
import type { MailAttachment } from '@/types/mail';

type AttachmentIconName =
  | 'file-pdf-box'
  | 'file-image'
  | 'file-word-box'
  | 'file-excel-box'
  | 'zip-box'
  | 'file-music'
  | 'file-video'
  | 'file-document-outline';

function getAttachmentIcon(mimeType: string): AttachmentIconName {
  if (mimeType.startsWith('image/')) return 'file-image';
  if (mimeType === 'application/pdf') return 'file-pdf-box';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word-box';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel-box';
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive'))
    return 'zip-box';
  if (mimeType.startsWith('audio/')) return 'file-music';
  if (mimeType.startsWith('video/')) return 'file-video';
  return 'file-document-outline';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  attachment: MailAttachment;
}

export function AttachmentRow({ attachment }: Props) {
  const { t } = useTranslation('common');
  const [downloading, setDownloading] = useState(false);
  const icon = getAttachmentIcon(attachment.mime_type);

  const handleDownload = async () => {
    if (!attachment.download_url || !attachment.can_download) return;
    setDownloading(true);
    try {
      const fileUri = `${FileSystem.cacheDirectory}${attachment.filename}`;
      const result = await FileSystem.downloadAsync(attachment.download_url, fileUri);
      if (result.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType: attachment.mime_type,
            dialogTitle: attachment.filename,
          });
        }
      }
    } catch {
      Alert.alert(t('common.error'), t('mail.errors.downloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handleDownload}
      disabled={downloading || !attachment.can_download}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={icon}
        size={28}
        color="#1976d2"
        style={styles.icon}
      />
      <View style={styles.info}>
        <Text style={styles.filename} numberOfLines={1}>
          {attachment.filename}
        </Text>
        <Text style={styles.size}>{formatBytes(attachment.size_bytes)}</Text>
      </View>
      {downloading ? (
        <ActivityIndicator size="small" color="#1976d2" />
      ) : attachment.can_download ? (
        <MaterialCommunityIcons name="download-outline" size={20} color="#1976d2" />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 12,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  filename: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.87)',
    marginBottom: 2,
  },
  size: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
  },
});
