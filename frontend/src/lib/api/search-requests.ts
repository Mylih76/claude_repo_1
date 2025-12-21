import { apiClient } from './client';
import type {
  CreateSearchRequestRequest,
  MatchResponse,
  PaginatedResponse,
  SearchRequest,
  SearchRequestFilters,
  UpdateSearchRequestRequest,
} from './types';

export async function getSearchRequests(
  filters?: SearchRequestFilters
): Promise<PaginatedResponse<SearchRequest>> {
  return apiClient.get<PaginatedResponse<SearchRequest>>('/search-requests', {
    params: filters as Record<string, string | number | undefined>,
  });
}

export async function getSearchRequest(id: string): Promise<SearchRequest> {
  return apiClient.get<SearchRequest>(`/search-requests/${id}`);
}

export async function createSearchRequest(
  data: CreateSearchRequestRequest
): Promise<SearchRequest> {
  return apiClient.post<SearchRequest, CreateSearchRequestRequest>(
    '/search-requests',
    data
  );
}

export async function updateSearchRequest(
  id: string,
  data: UpdateSearchRequestRequest
): Promise<SearchRequest> {
  return apiClient.patch<SearchRequest, UpdateSearchRequestRequest>(
    `/search-requests/${id}`,
    data
  );
}

export async function deleteSearchRequest(
  id: string
): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/search-requests/${id}`);
}

export async function triggerMatching(id: string): Promise<MatchResponse> {
  return apiClient.post<MatchResponse>(`/search-requests/${id}/match`);
}
