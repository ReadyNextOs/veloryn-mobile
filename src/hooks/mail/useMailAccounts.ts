import { useQuery } from '@tanstack/react-query';
import { mailApi } from '@/api/mail';
import type { MailAccount } from '@/types/mail';

export function useMailAccounts() {
  return useQuery<MailAccount[]>({
    queryKey: ['mail', 'accounts'],
    queryFn: async () => {
      const res = await mailApi.listAccounts();
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
