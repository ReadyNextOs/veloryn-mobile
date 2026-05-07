import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MailFolder } from '@/types/mail';

type FolderIconName =
  | 'inbox'
  | 'send'
  | 'file-document-outline'
  | 'archive-outline'
  | 'delete-outline'
  | 'alert-octagon-outline'
  | 'folder-outline';

function getFolderIcon(type: MailFolder['type']): FolderIconName {
  const map: Record<MailFolder['type'], FolderIconName> = {
    inbox: 'inbox',
    sent: 'send',
    drafts: 'file-document-outline',
    archive: 'archive-outline',
    trash: 'delete-outline',
    spam: 'alert-octagon-outline',
    custom: 'folder-outline',
  };
  return map[type] ?? 'folder-outline';
}

interface Props {
  folder: MailFolder;
  folderLabel: string;
  onPress: () => void;
}

export function MailFolderRow({ folder, folderLabel, onPress }: Props) {
  const icon = getFolderIcon(folder.type);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <MaterialCommunityIcons name={icon} size={22} color="#1976d2" style={styles.icon} />
      <Text style={styles.label} numberOfLines={1}>
        {folderLabel}
      </Text>
      {folder.unread_count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {folder.unread_count > 99 ? '99+' : folder.unread_count}
          </Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(0,0,0,0.3)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(0,0,0,0.87)',
  },
  badge: {
    backgroundColor: '#1976d2',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
