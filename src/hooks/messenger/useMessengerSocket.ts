// WebSocket hook — subskrypcja kanalow Reverb dla aktywnego watku i global user.
// Handlery event zmieniaja TanStack Query cache bez refetcha.

import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { getEcho } from '@/lib/echo';
import { useAuthStore } from '@/store/auth';
import { useMessengerStore } from '@/store/messenger';
import { THREADS_QUERY_KEY } from '@/hooks/messenger/useThreads';
import { getMessagesQueryKey } from '@/hooks/messenger/useMessages';
import type { MessengerBroadcastEvent, Message, Thread } from '@/types/messenger';

type EchoInstance = {
  private: (channel: string) => EchoChannel;
  leave: (channel: string) => void;
  disconnect: () => void;
};

type EchoChannel = {
  listen: (event: string, cb: (data: unknown) => void) => EchoChannel;
  stopListening: (event: string) => void;
};

const BACKGROUND_DISCONNECT_DELAY_MS = 30_000;

// ---------------------------------------------------------------------------
// Zod schema for Reverb broadcast events — prevents malformed payloads from
// corrupting the TanStack Query cache.
// ---------------------------------------------------------------------------

const MessageSchema = z.object({
  id: z.string(),
  thread_id: z.string(),
  author_id: z.string(),
  author: z
    .object({
      id: z.string(),
      display_name: z.string(),
      avatar_url: z.string().nullable().optional(),
    })
    .optional(),
  type: z.enum(['text', 'system', 'call', 'file']),
  body: z.string(),
  body_html: z.string().nullable(),
  is_question: z.boolean(),
  is_edited: z.boolean(),
  is_deleted: z.boolean(),
  reply_to_id: z.string().nullable(),
  reactions: z.array(z.unknown()),
  attachments: z.array(z.unknown()),
  mentions: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

const MessengerBroadcastEventSchema = z.discriminatedUnion('event', [
  z.object({ event: z.literal('message.created'), thread_id: z.string(), message: MessageSchema }),
  z.object({ event: z.literal('message.updated'), thread_id: z.string(), message: MessageSchema }),
  z.object({ event: z.literal('message.deleted'), thread_id: z.string(), message_id: z.string() }),
  z.object({ event: z.literal('thread.read'), thread_id: z.string(), user_id: z.string(), last_read_at: z.string() }),
  z.object({
    event: z.union([z.literal('reaction.added'), z.literal('reaction.removed')]),
    thread_id: z.string(),
    message_id: z.string(),
    emoji: z.string(),
    user_id: z.string(),
  }),
  z.object({ event: z.literal('typing'), thread_id: z.string(), user_id: z.string(), expires_at: z.string() }),
]);

function parseEvent(raw: unknown): MessengerBroadcastEvent | null {
  const result = MessengerBroadcastEventSchema.safeParse(raw);
  if (!result.success) {
    console.warn('[Echo] Invalid Reverb event payload:', result.error.issues);
    return null;
  }
  return result.data as MessengerBroadcastEvent;
}

export function useMessengerSocket(threadId: string | null): void {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const isPaired = useAuthStore((s) => s.isPaired);
  const addTypingUser = useMessengerStore((s) => s.addTypingUser);

  const echoRef = useRef<EchoInstance | null>(null);
  const bgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Handler for messages in active thread
  const handleThreadEvent = useCallback((raw: unknown) => {
    const event = parseEvent(raw);
    if (!event || !threadId) return;

    switch (event.event) {
      case 'message.created': {
        const msgQueryKey = getMessagesQueryKey(threadId);

        // Guard 1: skip echo of our own message (already in cache via onSuccess)
        const recentlySentByMe = useMessengerStore.getState().recentlySentByMe;
        if (recentlySentByMe.has(event.message.id)) {
          break;
        }

        queryClient.setQueryData(msgQueryKey, (old: unknown) => {
          if (!old) return old;
          const data = old as { pages: Array<{ messages: Message[] }>; pageParams: unknown[] };
          if (!data.pages || data.pages.length === 0) return old;
          const lastIdx = data.pages.length - 1;
          const lastPage = data.pages[lastIdx];
          if (!lastPage) return old;

          // Guard 2: skip if message ID already present anywhere in cache
          const existsAnywhere = data.pages.some((page) =>
            page.messages.some((m) => m.id === event.message.id),
          );
          if (existsAnywhere) return old;

          // Guard 3: if an optimistic message from the same author with same body
          // arrived within 5 s, replace it instead of appending (Reverb before onSuccess race)
          const optimisticMatch = data.pages
            .flatMap((p) => p.messages)
            .find(
              (m) =>
                m.id.startsWith('__optimistic_') &&
                m.author_id === event.message.author_id &&
                m.body === event.message.body &&
                Math.abs(
                  new Date(m.created_at).getTime() -
                    new Date(event.message.created_at).getTime(),
                ) < 5_000,
            );

          if (optimisticMatch) {
            // Replace optimistic with server message
            const updatedPages = data.pages.map((page) => ({
              ...page,
              messages: page.messages.map((m) =>
                m.id === optimisticMatch.id ? event.message : m,
              ),
            }));
            return { ...data, pages: updatedPages };
          }

          // Normal append
          const updatedPages = data.pages.map((page, idx) =>
            idx === lastIdx
              ? { ...page, messages: [...page.messages, event.message] }
              : page,
          );
          return { ...data, pages: updatedPages };
        });
        // Also mark thread unread_count update in list
        void queryClient.invalidateQueries({ queryKey: THREADS_QUERY_KEY });
        break;
      }

      case 'message.updated': {
        const msgQueryKey = getMessagesQueryKey(threadId);
        queryClient.setQueryData(msgQueryKey, (old: unknown) => {
          if (!old) return old;
          const data = old as { pages: Array<{ messages: Message[] }>; pageParams: unknown[] };
          if (!data.pages) return old;
          const updatedPages = data.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              m.id === event.message.id ? event.message : m,
            ),
          }));
          return { ...data, pages: updatedPages };
        });
        break;
      }

      case 'message.deleted': {
        const msgQueryKey = getMessagesQueryKey(threadId);
        queryClient.setQueryData(msgQueryKey, (old: unknown) => {
          if (!old) return old;
          const data = old as { pages: Array<{ messages: Message[] }>; pageParams: unknown[] };
          if (!data.pages) return old;
          const updatedPages = data.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              m.id === event.message_id
                ? { ...m, is_deleted: true, body: '', body_html: null }
                : m,
            ),
          }));
          return { ...data, pages: updatedPages };
        });
        break;
      }

      case 'reaction.added':
      case 'reaction.removed': {
        void queryClient.invalidateQueries({
          queryKey: getMessagesQueryKey(threadId),
        });
        break;
      }

      case 'typing': {
        if (event.user_id === userId) break; // don't show own typing
        const expiresAt = new Date(event.expires_at).getTime();
        // Resolve display name from threads cache (participants)
        const threads = queryClient.getQueryData<Thread[]>(THREADS_QUERY_KEY);
        const thread = threads?.find((t) => t.id === threadId);
        const participant = thread?.participants?.find((p) => p.user_id === event.user_id);
        const displayName = participant?.user?.display_name ?? event.user_id;
        addTypingUser(threadId, {
          userId: event.user_id,
          displayName,
          expiresAt,
        });
        break;
      }

      case 'thread.read': {
        queryClient.setQueryData<Thread[]>(THREADS_QUERY_KEY, (old) => {
          if (!old) return old;
          return old.map((t) =>
            t.id === event.thread_id && event.user_id === userId
              ? { ...t, unread_count: 0 }
              : t,
          );
        });
        break;
      }
    }
  }, [addTypingUser, queryClient, threadId, userId]);

  // Handle global user events (new threads, mentions)
  const handleUserEvent = useCallback((raw: unknown) => {
    const event = parseEvent(raw);
    if (!event) return;

    if (event.event === 'message.created') {
      void queryClient.invalidateQueries({ queryKey: THREADS_QUERY_KEY });
    }
  }, [queryClient]);

  const subscribe = useCallback(async () => {
    if (!isPaired || !userId || !isMountedRef.current) return;

    const echo = await getEcho();
    if (!echo || !isMountedRef.current) return;

    echoRef.current = echo as EchoInstance;

    // Global user channel
    try {
      echoRef.current
        .private(`messenger.user.${userId}`)
        .listen('.message.created', handleUserEvent);
    } catch (err) {
      console.warn('[Echo] Failed to subscribe user channel:', err);
    }

    // Active thread channel
    if (threadId) {
      try {
        echoRef.current
          .private(`messenger.thread.${threadId}`)
          .listen('.message.created', handleThreadEvent)
          .listen('.message.updated', handleThreadEvent)
          .listen('.message.deleted', handleThreadEvent)
          .listen('.thread.read', handleThreadEvent)
          .listen('.reaction.added', handleThreadEvent)
          .listen('.reaction.removed', handleThreadEvent)
          .listen('.typing', handleThreadEvent);
      } catch (err) {
        console.warn('[Echo] Failed to subscribe thread channel:', err);
      }
    }
  }, [handleThreadEvent, handleUserEvent, isPaired, threadId, userId]);

  const unsubscribeThread = useCallback(() => {
    if (!echoRef.current || !threadId) return;
    try {
      echoRef.current.leave(`private-messenger.thread.${threadId}`);
    } catch {
      // ignore
    }
  }, [threadId]);

  // Connect on mount, reconnect when threadId changes
  useEffect(() => {
    isMountedRef.current = true;
    void subscribe();

    return () => {
      isMountedRef.current = false;
      if (threadId) unsubscribeThread();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, isPaired, userId]);

  // Background/foreground lifecycle
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        if (bgTimerRef.current !== null) {
          clearTimeout(bgTimerRef.current);
          bgTimerRef.current = null;
        }
        // Reconnect on foreground
        void subscribe();
      } else if (state === 'background' || state === 'inactive') {
        // Disconnect after 30s to save battery
        bgTimerRef.current = setTimeout(() => {
          if (echoRef.current) {
            try {
              echoRef.current.disconnect();
            } catch {
              // ignore
            }
            echoRef.current = null;
          }
        }, BACKGROUND_DISCONNECT_DELAY_MS);
      }
    });

    return () => sub.remove();
  }, [subscribe]);
}
