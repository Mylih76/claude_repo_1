import type { ListingFilters, SearchRequestFilters } from '@/lib/api/types';

export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'] as const,
  },

  // Listings
  listings: {
    all: ['listings'] as const,
    list: (filters?: ListingFilters) => ['listings', 'list', filters] as const,
    detail: (id: string) => ['listings', 'detail', id] as const,
  },

  // Search Requests
  searchRequests: {
    all: ['searchRequests'] as const,
    list: (filters?: SearchRequestFilters) =>
      ['searchRequests', 'list', filters] as const,
    detail: (id: string) => ['searchRequests', 'detail', id] as const,
    matches: (id: string) => ['searchRequests', 'matches', id] as const,
  },
} as const;
