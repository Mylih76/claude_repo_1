'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSearchRequest,
  deleteSearchRequest,
  getSearchRequest,
  getSearchRequests,
  triggerMatching,
  updateSearchRequest,
} from '@/lib/api/search-requests';
import type {
  CreateSearchRequestRequest,
  SearchRequestFilters,
  UpdateSearchRequestRequest,
} from '@/lib/api/types';
import { queryKeys } from './query-keys';

export function useSearchRequests(filters?: SearchRequestFilters) {
  return useQuery({
    queryKey: queryKeys.searchRequests.list(filters),
    queryFn: () => getSearchRequests(filters),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useSearchRequest(id: string) {
  return useQuery({
    queryKey: queryKeys.searchRequests.detail(id),
    queryFn: () => getSearchRequest(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateSearchRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSearchRequestRequest) => createSearchRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.searchRequests.all,
      });
    },
  });
}

export function useUpdateSearchRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSearchRequestRequest;
    }) => updateSearchRequest(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.searchRequests.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.searchRequests.all,
      });
    },
  });
}

export function useDeleteSearchRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSearchRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.searchRequests.all,
      });
    },
  });
}

export function useTriggerMatching(searchRequestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => triggerMatching(searchRequestId),
    onSuccess: (data) => {
      // Cache the matches
      queryClient.setQueryData(
        queryKeys.searchRequests.matches(searchRequestId),
        data
      );
    },
  });
}

export function useMatches(searchRequestId: string) {
  return useQuery({
    queryKey: queryKeys.searchRequests.matches(searchRequestId),
    queryFn: () => triggerMatching(searchRequestId),
    enabled: false, // Only fetch when explicitly triggered
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
