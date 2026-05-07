import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { mailApi } from '@/api/mail';
import type { MailListItem, MailListItemRaw, MailListParams } from '@/types/mail';
import { getCachedMailMessages, cacheMailMessages } from '@/lib/db';

export function mapListItem(raw: MailListItemRaw): MailListItem {
  return {
    id: raw.id,
    email_id: raw.email_id,
    subject: raw.subject,
    from: raw.from,
    preview: raw.preview,
    received_at: raw.received_at,
    is_read: raw.is_read,
    is_starred: raw.is_flagged,
    has_attachments: raw.has_attachments,
    attachments_count: raw.attachments_count,
    size_bytes: raw.size_bytes,
  };
}

interface UseMailMessagesOptions {
  accountId: string | null;
  folderId: string | null;
  filters?: Omit<MailListParams, 'page'>;
}

export function useMailMessages({ accountId, folderId, filters }: UseMailMessagesOptions) {
  const queryClient = useQueryClient();

  return useInfiniteQuery<MailListItem[], Error, MailListItem[], unknown[], number>({
    queryKey: ['mail', 'messages', accountId, folderId, filters],
    queryFn: async ({ pageParam }) => {
      if (!accountId || !folderId) return [];
      try {
        const res = await mailApi.listMessages(accountId, folderId, {
          ...filters,
          page: pageParam,
          per_page: 25,
        });
        const items = res.data.map(mapListItem);
        // Cache results
        await cacheMailMessages(accountId, folderId, items);
        return items;
      } catch (err) {
        // On network error — fallback to cache
        const errMsg = err instanceof Error ? err.message : '';
        if (errMsg.includes('Network') || errMsg.includes('timeout')) {
          const cached = await getCachedMailMessages(accountId, folderId);
          if (cached.length > 0) return cached;
        }
        throw err;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (_lastPage, allPages) => {
      // Fetch next if last page had 25 items
      const lastPage = allPages[allPages.length - 1];
      if (!lastPage || lastPage.length < 25) return undefined;
      return allPages.length + 1;
    },
    enabled: !!accountId && !!folderId,
    placeholderData: () => {
      // Try to get cached data synchronously (returns undefined — async cache loaded separately)
      return undefined;
    },
    staleTime: 60 * 1000, // 1 min
  });
}

// Exported for use in optimistic updates
export function getMessagesQueryKey(
  accountId: string,
  folderId: string,
  filters?: Omit<MailListParams, 'page'>,
): unknown[] {
  return ['mail', 'messages', accountId, folderId, filters];
}
