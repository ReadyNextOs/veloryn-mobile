import { useCallback, useRef } from 'react';
import { messengerApi } from '@/api/messenger';

const DEBOUNCE_MS = 500;

export function useTyping(threadId: string | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<number>(0);

  const emitTyping = useCallback(() => {
    if (!threadId) return;

    const now = Date.now();
    // Rate-limit: max 1 request per 2s regardless of debounce
    if (now - lastSentRef.current < 2000) return;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (!threadId) return;
      lastSentRef.current = Date.now();
      messengerApi.setTyping(threadId).catch(() => {
        // Typing is fire-and-forget, ignore errors
      });
    }, DEBOUNCE_MS);
  }, [threadId]);

  const cancelTyping = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { emitTyping, cancelTyping };
}
