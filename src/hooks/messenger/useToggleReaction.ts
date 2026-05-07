import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messengerApi } from '@/api/messenger';
import { getMessagesQueryKey } from '@/hooks/messenger/useMessages';
import { useAuthStore } from '@/store/auth';
import type { Message, Reaction } from '@/types/messenger';

interface ToggleReactionVars {
  threadId: string;
  messageId: string;
  emoji: string;
}

function updateReactions(reactions: Reaction[], emoji: string, userId: string): Reaction[] {
  const existing = reactions.find((r) => r.emoji === emoji);

  if (existing) {
    const alreadyReacted = existing.reacted || existing.user_ids.includes(userId);
    if (alreadyReacted) {
      // Remove
      const newCount = existing.count - 1;
      if (newCount <= 0) {
        return reactions.filter((r) => r.emoji !== emoji);
      }
      return reactions.map((r) =>
        r.emoji === emoji
          ? {
              ...r,
              count: newCount,
              reacted: false,
              user_ids: r.user_ids.filter((id) => id !== userId),
            }
          : r,
      );
    }
    // Add to existing
    return reactions.map((r) =>
      r.emoji === emoji
        ? {
            ...r,
            count: r.count + 1,
            reacted: true,
            user_ids: [...r.user_ids, userId],
          }
        : r,
    );
  }

  // New reaction
  return [
    ...reactions,
    { emoji, count: 1, reacted: true, user_ids: [userId] },
  ];
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation<void, Error, ToggleReactionVars>({
    mutationFn: ({ messageId, emoji }) =>
      messengerApi.toggleReaction(messageId, emoji),

    onMutate: async ({ threadId, messageId, emoji }) => {
      if (!user) return;
      const queryKey = getMessagesQueryKey(threadId);
      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueryData(queryKey, (old: ReturnType<typeof queryClient.getQueryData>) => {
        if (!old) return old;
        const data = old as { pages: Array<{ messages: Message[] }>; pageParams: unknown[] };
        if (!data.pages) return old;
        const updatedPages = data.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) =>
            m.id === messageId
              ? { ...m, reactions: updateReactions(m.reactions, emoji, user.id) }
              : m,
          ),
        }));
        return { ...data, pages: updatedPages };
      });
    },

    onSettled: (_data, _err, { threadId }) => {
      void queryClient.invalidateQueries({
        queryKey: getMessagesQueryKey(threadId),
      });
    },
  });
}
