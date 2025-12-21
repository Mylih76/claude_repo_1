'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchRequests } from '@/lib/hooks/use-search-requests';
import type { SearchRequestFilters } from '@/lib/api/types';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { SearchRequestsTable } from '@/components/search-requests';
import { Pagination } from '@/components/listings';

function SearchRequestsContent() {
  const searchParams = useSearchParams();

  const filters: SearchRequestFilters = {
    page: Number(searchParams.get('page')) || 1,
    limit: 20,
  };

  const { data, isLoading, error } = useSearchRequests(filters);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
        Failed to load search requests. Please try again.
      </div>
    );
  }

  if (!data?.data.length) {
    return (
      <EmptyState
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        }
        title="No search requests yet"
        description="Create a search request to find matching listings for your clients."
        action={{ label: 'Create Search Request', href: '/search-requests/new' }}
      />
    );
  }

  return (
    <>
      <SearchRequestsTable searchRequests={data.data} />
      <Pagination meta={data.meta} baseUrl="/search-requests" />
    </>
  );
}

export default function SearchRequestsPage() {
  return (
    <div>
      <PageHeader
        title="Search Requests"
        description="Manage buyer requirements and find matching listings"
        action={{
          label: 'New Request',
          href: '/search-requests/new',
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mr-2 h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          ),
        }}
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        }
      >
        <SearchRequestsContent />
      </Suspense>
    </div>
  );
}
