import { useQuery } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';
import { messengerApi } from '@/api/messenger';
import type { Thread } from '@/types/messenger';

export const THREADS_QUERY_KEY = ['messenger', 'threads'] as const;

export function useThreads() {
  const isActivRef = useRef(true);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      isActivRef.current = state === 'active';
    });
    return () => sub.remove();
  }, []);

  return useQuery<Thread[], Error>({
    queryKey: THREADS_QUERY_KEY,
    queryFn: async () => {
      const res = await messengerApi.listThreads();
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    refetchInterval: (query) => {
      // Refetch co 30s tylko gdy app na pierwszym planie i dane nie są świeże
      if (!isActivRef.current) return false;
      if (query.state.status === 'success') return 30_000;
      return false;
    },
  });
}
