import { useQuery } from '@tanstack/react-query';
import { mailApi } from '@/api/mail';
import type { MailNotificationSummary } from '@/types/mail';

export function useNotificationSummary() {
  return useQuery<MailNotificationSummary>({
    queryKey: ['mail', 'notification-summary'],
    queryFn: () => mailApi.getNotificationSummary(),
    refetchInterval: 60 * 1000, // co 60 sekund
    staleTime: 30 * 1000,
  });
}
