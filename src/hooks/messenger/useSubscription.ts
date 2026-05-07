import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messengerApi } from '@/api/messenger';
import { THREADS_QUERY_KEY } from '@/hooks/messenger/useThreads';
import type { SubscriptionLevel, Thread } from '@/types/messenger';

interface SubscriptionVars {
  threadId: string;
  level: SubscriptionLevel;
}

export function useSubscription() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, SubscriptionVars>({
    mutationFn: ({ threadId, level }) =>
      messengerApi.setSubscription(threadId, level),

    onMutate: async ({ threadId, level }) => {
      await queryClient.cancelQueries({ queryKey: THREADS_QUERY_KEY });
      queryClient.setQueryData<Thread[]>(THREADS_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map((t) =>
          t.id === threadId
            ? {
                ...t,
                subscription: {
                  thread_id: threadId,
                  level,
                },
              }
            : t,
        );
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: THREADS_QUERY_KEY });
    },
  });
}
