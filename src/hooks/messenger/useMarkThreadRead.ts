import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messengerApi } from '@/api/messenger';
import { THREADS_QUERY_KEY } from '@/hooks/messenger/useThreads';
import type { Thread } from '@/types/messenger';

export function useMarkThreadRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (threadId) => messengerApi.markThreadRead(threadId),

    onMutate: async (threadId) => {
      await queryClient.cancelQueries({ queryKey: THREADS_QUERY_KEY });

      // Optimistic: zero unread_count in threads list
      queryClient.setQueryData<Thread[]>(THREADS_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map((t) =>
          t.id === threadId ? { ...t, unread_count: 0 } : t,
        );
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: THREADS_QUERY_KEY });
    },
  });
}
