import { useQuery } from '@tanstack/react-query';
import { mailApi } from '@/api/mail';
import type { MailFolder, MailFolderRaw } from '@/types/mail';

function mapFolder(raw: MailFolderRaw): MailFolder {
  return {
    id: raw.id,
    account_id: raw.account_id,
    name: raw.name,
    type: raw.type,
    unread_count: raw.unread_messages,
    total_count: raw.total_messages,
    parent_id: raw.parent_id,
    icon: raw.icon,
    is_visible: raw.is_visible,
    is_excluded: raw.is_excluded,
    priority: raw.priority,
  };
}

export function useMailFolders(accountId: string | null) {
  return useQuery<MailFolder[]>({
    queryKey: ['mail', 'folders', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const res = await mailApi.listFolders(accountId);
      return res.data.map(mapFolder);
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000, // 2 min
  });
}
