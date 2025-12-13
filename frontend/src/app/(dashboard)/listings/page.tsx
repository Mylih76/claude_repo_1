'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useListings } from '@/lib/hooks/use-listings';
import type { ListingFilters } from '@/lib/api/types';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/layout/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ListingsTable, ListingFilters as ListingFiltersComponent, Pagination } from '@/components/listings';

function ListingsContent() {
  const searchParams = useSearchParams();

  const filters: ListingFilters = {
    page: Number(searchParams.get('page')) || 1,
    limit: 20,
    listingType: (searchParams.get('listingType') as ListingFilters['listingType']) || undefined,
    city: searchParams.get('city') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  };

  const { data, isLoading, error } = useListings(filters);

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
        Failed to load listings. Please try again.
      </div>
    );
  }

  const hasFilters = filters.listingType || filters.city || filters.minPrice || filters.maxPrice;

  if (!data?.data.length) {
    return (
      <>
        <ListingFiltersComponent />
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
                d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
              />
            </svg>
          }
          title={hasFilters ? 'No listings found' : 'No listings yet'}
          description={
            hasFilters
              ? 'Try adjusting your filters to find what you\'re looking for.'
              : 'Get started by creating your first property listing.'
          }
          action={
            hasFilters
              ? undefined
              : { label: 'Create Listing', href: '/listings/new' }
          }
        />
      </>
    );
  }

  return (
    <>
      <ListingFiltersComponent />
      <ListingsTable listings={data.data} />
      <Pagination meta={data.meta} baseUrl="/listings" />
    </>
  );
}

export default function ListingsPage() {
  return (
    <div>
      <PageHeader
        title="Listings"
        description="Manage your property listings"
        action={{
          label: 'New Listing',
          href: '/listings/new',
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
        <ListingsContent />
      </Suspense>
    </div>
  );
}
