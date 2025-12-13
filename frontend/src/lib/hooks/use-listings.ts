'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createListing,
  deleteListing,
  getListing,
  getListings,
  updateListing,
} from '@/lib/api/listings';
import type {
  CreateListingRequest,
  ListingFilters,
  UpdateListingRequest,
} from '@/lib/api/types';
import { queryKeys } from './query-keys';

export function useListings(filters?: ListingFilters) {
  return useQuery({
    queryKey: queryKeys.listings.list(filters),
    queryFn: () => getListings(filters),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: () => getListing(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateListingRequest) => createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListingRequest }) =>
      updateListing(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.listings.detail(id),
      });

      // Snapshot previous value
      const previousListing = queryClient.getQueryData(
        queryKeys.listings.detail(id)
      );

      // Optimistically update
      queryClient.setQueryData(queryKeys.listings.detail(id), (old: unknown) => ({
        ...(old as object),
        ...data,
      }));

      return { previousListing };
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousListing) {
        queryClient.setQueryData(
          queryKeys.listings.detail(id),
          context.previousListing
        );
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.listings.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
    },
  });
}
