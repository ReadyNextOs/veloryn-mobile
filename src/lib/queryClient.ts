// Singleton TanStack QueryClient — wyeksportowany z _layout.tsx żeby logout helper
// (poza React tree) mógł wywołać queryClient.clear() bez circular dependency.

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
});
