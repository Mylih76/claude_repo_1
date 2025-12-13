import { apiClient } from './client';
import type {
  CreateListingRequest,
  ListingDetail,
  ListingFilters,
  ListingListItem,
  PaginatedResponse,
  UpdateListingRequest,
} from './types';

export async function getListings(
  filters?: ListingFilters
): Promise<PaginatedResponse<ListingListItem>> {
  return apiClient.get<PaginatedResponse<ListingListItem>>('/listings', {
    params: filters as Record<string, string | number | undefined>,
  });
}

export async function getListing(id: string): Promise<ListingDetail> {
  return apiClient.get<ListingDetail>(`/listings/${id}`);
}

export async function createListing(
  data: CreateListingRequest
): Promise<ListingDetail> {
  return apiClient.post<ListingDetail, CreateListingRequest>('/listings', data);
}

export async function updateListing(
  id: string,
  data: UpdateListingRequest
): Promise<ListingDetail> {
  return apiClient.patch<ListingDetail, UpdateListingRequest>(
    `/listings/${id}`,
    data
  );
}

export async function deleteListing(
  id: string
): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/listings/${id}`);
}
