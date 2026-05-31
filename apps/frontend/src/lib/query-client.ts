import { QueryClient } from '@tanstack/react-query';

/**
 * Shared React Query client instance used by the application query providers.
 */
export const queryClientInstance: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
