import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { messengerApi } from '@/api/messenger';
import type { Message, MessageListResponse } from '@/types/messenger';

export function getMessagesQueryKey(threadId: string): readonly ['messenger', 'messages', string] {
  return ['messenger', 'messages', threadId] as const;
}

interface MessagesPage {
  messages: Message[];
  cursor_before: string | null;
  has_more_before: boolean;
}

export function useMessages(threadId: string | null) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<
    MessagesPage,
    Error,
    InfiniteData<MessagesPage>,
    readonly ['messenger', 'messages', string],
    string | null
  >({
    queryKey: getMessagesQueryKey(threadId ?? '__no_thread'),
    queryFn: async ({ pageParam }) => {
      if (!threadId) {
        return { messages: [], cursor_before: null, has_more_before: false };
      }
      const res: MessageListResponse = await messengerApi.listMessages(threadId, {
        cursor_before: pageParam ?? undefined,
        limit: 30,
      });
      return {
        messages: res.data,
        cursor_before: res.cursor_before,
        has_more_before: res.has_more_before,
      };
    },
    initialPageParam: null,
    getNextPageParam: (firstPage) => {
      // inverted FlatList: "next page" means older messages via cursor_before
      if (!firstPage.has_more_before) return undefined;
      return firstPage.cursor_before;
    },
    enabled: !!threadId,
    staleTime: 60 * 1000,
  });

  const allMessages: Message[] = query.data
    ? query.data.pages.flatMap((p) => p.messages)
    : [];

  function appendOptimisticMessage(message: Message): void {
    queryClient.setQueryData<InfiniteData<MessagesPage>>(
      getMessagesQueryKey(threadId ?? '__no_thread'),
      (old) => {
        if (!old) return old;
        const lastPageIdx = old.pages.length - 1;
        const lastPage = old.pages[lastPageIdx];
        if (!lastPage) return old;
        const updatedPages = old.pages.map((page, idx) =>
          idx === lastPageIdx
            ? { ...page, messages: [...page.messages, message] }
            : page,
        );
        return { ...old, pages: updatedPages };
      },
    );
  }

  function replaceOptimisticMessage(tempId: string, serverMessage: Message): void {
    queryClient.setQueryData<InfiniteData<MessagesPage>>(
      getMessagesQueryKey(threadId ?? '__no_thread'),
      (old) => {
        if (!old) return old;
        const updatedPages = old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) =>
            m.id === tempId ? serverMessage : m,
          ),
        }));
        return { ...old, pages: updatedPages };
      },
    );
  }

  function removeMessage(messageId: string): void {
    queryClient.setQueryData<InfiniteData<MessagesPage>>(
      getMessagesQueryKey(threadId ?? '__no_thread'),
      (old) => {
        if (!old) return old;
        const updatedPages = old.pages.map((page) => ({
          ...page,
          messages: page.messages.filter((m) => m.id !== messageId),
        }));
        return { ...old, pages: updatedPages };
      },
    );
  }

  function updateMessage(updated: Message): void {
    queryClient.setQueryData<InfiniteData<MessagesPage>>(
      getMessagesQueryKey(threadId ?? '__no_thread'),
      (old) => {
        if (!old) return old;
        const updatedPages = old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) => (m.id === updated.id ? updated : m)),
        }));
        return { ...old, pages: updatedPages };
      },
    );
  }

  return {
    ...query,
    allMessages,
    appendOptimisticMessage,
    replaceOptimisticMessage,
    removeMessage,
    updateMessage,
  };
}
