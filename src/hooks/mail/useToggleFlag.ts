import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { mailApi } from '@/api/mail';
import type { EmailDetail, MailListItem } from '@/types/mail';

interface ToggleFlagParams {
  accountId: string;
  folderId: string;
  messageIds: string[];
  /** Nowy stan po toggle (true = dodaj gwiazdkę) */
  newStarred: boolean;
}

export function useToggleFlag() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ToggleFlagParams>({
    mutationFn: ({ accountId, folderId, messageIds }) =>
      mailApi.toggleFlag(accountId, folderId, messageIds),

    onMutate: async ({ accountId, folderId, messageIds, newStarred }) => {
      const messagesKey = ['mail', 'messages', accountId, folderId];
      await queryClient.cancelQueries({ queryKey: messagesKey });

      const previousMessages = queryClient.getQueriesData<InfiniteData<MailListItem[]>>({
        queryKey: messagesKey,
      });

      // Optimistic update na liście
      queryClient.setQueriesData<InfiniteData<MailListItem[]>>(
        { queryKey: messagesKey },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                messageIds.includes(item.id) ? { ...item, is_starred: newStarred } : item,
              ),
            ),
          };
        },
      );

      // Optimistic update na detalu
      for (const messageId of messageIds) {
        const detailKey = ['mail', 'message', accountId, folderId, messageId];
        queryClient.setQueryData<EmailDetail>(detailKey, (old) =>
          old ? { ...old, is_starred: newStarred } : old,
        );
      }

      return { previousMessages };
    },

    onError: (_err, { accountId, folderId }, context) => {
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
