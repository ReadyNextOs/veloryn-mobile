import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { mailApi } from '@/api/mail';
import type { MailListItem, MailListItemRaw, MailListParams, MailListResponse } from '@/types/mail';
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

// Strona zwracana przez queryFn — trzyma raw response meta obok zmapowanych itemów
interface MailPage {
  items: MailListItem[];
  meta: Pick<MailListResponse, 'current_page' | 'next_page_url'>;
}

interface UseMailMessagesOptions {
  accountId: string | null;
  folderId: string | null;
  filters?: Omit<MailListParams, 'page'>;
}

export function useMailMessages({ accountId, folderId, filters }: UseMailMessagesOptions) {
  const query = useInfiniteQuery<MailPage, Error, InfiniteData<MailPage>, unknown[], number>({
    queryKey: ['mail', 'messages', accountId, folderId, filters],
    queryFn: async ({ pageParam }) => {
      if (!accountId || !folderId) {
        return { items: [], meta: { current_page: 1, next_page_url: null } };
      }
      try {
        const res = await mailApi.listMessages(accountId, folderId, {
          ...filters,
          page: pageParam,
          per_page: 25,
        });
        const items = res.data.map(mapListItem);
        // Cache results
        await cacheMailMessages(accountId, folderId, items);
        return {
          items,
          meta: { current_page: res.current_page, next_page_url: res.next_page_url },
        };
      } catch (err) {
        // On network error — fallback to cache
        const errMsg = err instanceof Error ? err.message : '';
        if (errMsg.includes('Network') || errMsg.includes('timeout')) {
          const cached = await getCachedMailMessages(accountId, folderId);
          if (cached.length > 0) {
            return { items: cached, meta: { current_page: pageParam, next_page_url: null } };
          }
        }
        throw err;
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Użyj authoritative next_page_url z serwera zamiast heurystyki length < 25
      if (!lastPage.meta.next_page_url) return undefined;
      return lastPage.meta.current_page + 1;
    },
    enabled: !!accountId && !!folderId,
    staleTime: 60 * 1000, // 1 min
  });

  // Spłaszcz pages do listy itemów — zachowuje zewnętrzny interfejs hooka
  const data = query.data
    ? {
        ...query.data,
        pages: query.data.pages.map((p) => p.items),
      }
    : undefined;

  return { ...query, data } as Omit<typeof query, 'data'> & {
    data: InfiniteData<MailListItem[]> | undefined;
  };
}

// Exported for use in optimistic updates
export function getMessagesQueryKey(
  accountId: string,
  folderId: string,
  filters?: Omit<MailListParams, 'page'>,
): unknown[] {
  return ['mail', 'messages', accountId, folderId, filters];
}
