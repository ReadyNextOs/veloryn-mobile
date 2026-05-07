// WebSocket hook — subskrypcja kanalow Reverb dla aktywnego watku i global user.
// Handlery event zmieniaja TanStack Query cache bez refetcha.

import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
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

function parseEvent(raw: unknown): MessengerBroadcastEvent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as Record<string, unknown>;
  if (typeof data['event'] !== 'string') return null;
  return data as unknown as MessengerBroadcastEvent;
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
        // Append to messages cache
        queryClient.setQueryData(msgQueryKey, (old: unknown) => {
          if (!old) return old;
          const data = old as { pages: Array<{ messages: Message[] }>; pageParams: unknown[] };
          if (!data.pages || data.pages.length === 0) return old;
          const lastIdx = data.pages.length - 1;
          const lastPage = data.pages[lastIdx];
          if (!lastPage) return old;
          // Avoid duplicate if same id already exists (optimistic might have been replaced)
          const exists = lastPage.messages.some((m) => m.id === event.message.id);
          if (exists) return old;
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
        addTypingUser(threadId, {
          userId: event.user_id,
          displayName: event.user_id, // Will be resolved via thread participants
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
