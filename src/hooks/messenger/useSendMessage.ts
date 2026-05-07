import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messengerApi } from '@/api/messenger';
import { getMessagesQueryKey } from '@/hooks/messenger/useMessages';
import type { Message, SendMessageRequest } from '@/types/messenger';
import { useAuthStore } from '@/store/auth';

let _optimisticCounter = 0;

export function generateOptimisticId(): string {
  _optimisticCounter += 1;
  return `__optimistic_${Date.now()}_${_optimisticCounter}`;
}

interface SendMessageVars {
  threadId: string;
  request: SendMessageRequest;
  /** Temp ID wygenerowany przez callera przed mutacją — do zastąpienia wiadomości serwerową. */
  tempId: string;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation<Message, Error, SendMessageVars>({
    mutationFn: async ({ threadId, request }) => {
      const res = await messengerApi.sendMessage(threadId, request);
      return res.data;
    },

    onMutate: async ({ threadId, request, tempId }) => {
      // Optimistic: insert local message with _optimisticId
      const queryKey = getMessagesQueryKey(threadId);
      await queryClient.cancelQueries({ queryKey });

      const optimisticMessage: Message = {
        id: tempId,
        thread_id: threadId,
        author_id: user?.id ?? '',
        author: user
          ? { id: user.id, display_name: user.display_name, avatar_url: user.avatar_url ?? null }
          : undefined,
        type: 'text',
        body: request.body,
        body_html: null,
        is_question: false,
        is_edited: false,
        is_deleted: false,
        reply_to_id: request.reply_to_id ?? null,
        reactions: [],
        attachments: [],
        mentions: request.mentions ?? [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Append optimistic message to last page
      queryClient.setQueryData(queryKey, (old: ReturnType<typeof queryClient.getQueryData>) => {
        if (!old) return old;
        const data = old as { pages: Array<{ messages: Message[]; cursor_before: string | null; has_more_before: boolean }>; pageParams: unknown[] };
        if (!data.pages || data.pages.length === 0) return old;
        const lastIdx = data.pages.length - 1;
        const updatedPages = data.pages.map((page, idx) =>
          idx === lastIdx
            ? { ...page, messages: [...page.messages, optimisticMessage] }
            : page,
        );
        return { ...data, pages: updatedPages };
      });

      return { tempId };
    },

    onSuccess: (serverMessage, { threadId, tempId }) => {
      const queryKey = getMessagesQueryKey(threadId);
      queryClient.setQueryData(queryKey, (old: ReturnType<typeof queryClient.getQueryData>) => {
        if (!old) return old;
        const data = old as { pages: Array<{ messages: Message[]; cursor_before: string | null; has_more_before: boolean }>; pageParams: unknown[] };
        if (!data.pages) return old;
        const updatedPages = data.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) => (m.id === tempId ? serverMessage : m)),
        }));
        return { ...data, pages: updatedPages };
      });
    },

    onError: (_err, { threadId, tempId }) => {
      // Mark message as failed — keep in list with error state
      const queryKey = getMessagesQueryKey(threadId);
      queryClient.setQueryData(queryKey, (old: ReturnType<typeof queryClient.getQueryData>) => {
        if (!old) return old;
        const data = old as { pages: Array<{ messages: Message[]; cursor_before: string | null; has_more_before: boolean }>; pageParams: unknown[] };
        if (!data.pages) return old;
        const updatedPages = data.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) =>
            m.id === tempId ? { ...m, id: `${tempId}__failed` } : m,
          ),
        }));
        return { ...data, pages: updatedPages };
      });
    },
  });
}
