'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LISTING_TYPES, LISTING_TYPE_LABELS } from '@/lib/utils/constants';

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const listingType = searchParams.get('listingType') || '';
  const city = searchParams.get('city') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filters change
      params.delete('page');
      router.push(`/listings?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push('/listings');
  }, [router]);

  const hasFilters = listingType || city || minPrice || maxPrice;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <div className="w-40">
        <Select
          label="Type"
          value={listingType}
          onChange={(e) => updateFilter('listingType', e.target.value)}
          options={[
            { value: '', label: 'All Types' },
            ...LISTING_TYPES.map((type) => ({
              value: type,
              label: LISTING_TYPE_LABELS[type],
            })),
          ]}
        />
      </div>

      <div className="w-40">
        <Input
          label="City"
          placeholder="Filter by city"
          value={city}
          onChange={(e) => updateFilter('city', e.target.value)}
        />
      </div>

      <div className="w-36">
        <Input
          label="Min Price"
          type="number"
          placeholder="Min"
          value={minPrice}
          onChange={(e) => updateFilter('minPrice', e.target.value)}
        />
      </div>

      <div className="w-36">
        <Input
          label="Max Price"
          type="number"
          placeholder="Max"
          value={maxPrice}
          onChange={(e) => updateFilter('maxPrice', e.target.value)}
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
