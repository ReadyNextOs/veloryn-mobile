import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { mailApi } from '@/api/mail';
import type { EmailDetail, MailListItem } from '@/types/mail';

interface MarkReadParams {
  accountId: string;
  folderId: string;
  messageIds: string[];
  isRead: boolean;
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, MarkReadParams>({
    mutationFn: ({ accountId, folderId, messageIds, isRead }) =>
      isRead
        ? mailApi.markRead(accountId, folderId, messageIds)
        : mailApi.markUnread(accountId, folderId, messageIds),

    onMutate: async ({ accountId, folderId, messageIds, isRead }) => {
      const messagesKey = ['mail', 'messages', accountId, folderId];
      await queryClient.cancelQueries({ queryKey: messagesKey });

      // Snapshot for rollback
      const previousMessages = queryClient.getQueriesData<InfiniteData<MailListItem[]>>({
        queryKey: messagesKey,
      });

      // Optimistic update on list
      queryClient.setQueriesData<InfiniteData<MailListItem[]>>(
        { queryKey: messagesKey },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                messageIds.includes(item.id) ? { ...item, is_read: isRead } : item,
              ),
            ),
          };
        },
      );

      // Optimistic update on detail (if cached)
      for (const messageId of messageIds) {
        const detailKey = ['mail', 'message', accountId, folderId, messageId];
        queryClient.setQueryData<EmailDetail>(detailKey, (old) =>
          old ? { ...old, is_read: isRead } : old,
        );
      }

      return { previousMessages };
    },

    onError: (_err, { accountId, folderId }, context) => {
      const messagesKey = ['mail', 'messages', accountId, folderId];
      const ctx = context as { previousMessages?: [unknown[], InfiniteData<MailListItem[]> | undefined][] } | undefined;
      if (ctx?.previousMessages) {
        for (const [queryKey, data] of ctx.previousMessages) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: (_data, _err, { accountId, folderId }) => {
      void queryClient.invalidateQueries({
        queryKey: ['mail', 'messages', accountId, folderId],
      });
    },
  });
}
