import { useQuery } from '@tanstack/react-query';
import { mailApi } from '@/api/mail';
import { ApiError } from '@/api/client';
import type { MailAccount } from '@/types/mail';

export type MailAccountsErrorCode =
  | 'MAIL_NOT_CONFIGURED'
  | 'NO_MAIL_ACCOUNTS'
  | 'NETWORK_ERROR';

export interface UseMailAccountsResult {
  data: MailAccount[] | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Typowany kod błędu — undefined gdy brak błędu lub dane dostępne. */
  derivedError: MailAccountsErrorCode | undefined;
  refetch: () => void;
}

export function useMailAccounts(): UseMailAccountsResult {
  const query = useQuery<MailAccount[], Error>({
    queryKey: ['mail', 'accounts'],
    queryFn: async () => {
      const res = await mailApi.listAccounts();
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });

  let derivedError: MailAccountsErrorCode | undefined;

  if (query.isError) {
    const err = query.error;
    if (err instanceof ApiError && err.status === 404) {
      derivedError = 'MAIL_NOT_CONFIGURED';
    } else if (
      err instanceof Error &&
      (err.message.includes('Network') || err.message.includes('timeout'))
    ) {
      derivedError = 'NETWORK_ERROR';
    } else {
      derivedError = 'MAIL_NOT_CONFIGURED'; // bezpieczny fallback
    }
  } else if (query.data !== undefined && query.data.length === 0) {
    derivedError = 'NO_MAIL_ACCOUNTS';
  }

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    derivedError,
    refetch: query.refetch,
  };
}
