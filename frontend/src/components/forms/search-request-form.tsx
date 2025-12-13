'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClientError } from '@/lib/api/client';
import type { SearchRequest, CreateSearchRequestRequest } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  ROOM_COUNTS,
  VIEW_TYPES,
  VIEW_TYPE_LABELS,
  LISTING_FEATURES,
  LISTING_FEATURE_LABELS,
} from '@/lib/utils/constants';

interface SearchRequestFormProps {
  initialData?: SearchRequest;
  onSubmit: (data: CreateSearchRequestRequest) => Promise<SearchRequest>;
  isLoading?: boolean;
}

export function SearchRequestForm({ initialData, onSubmit, isLoading = false }: SearchRequestFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    initialData?.criteria.features || []
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    const data: CreateSearchRequestRequest = {
      rawText: (formData.get('rawText') as string) || undefined,
      criteria: {
        listingType: (formData.get('listingType') as 'sale' | 'rent') || undefined,
        city: (formData.get('city') as string) || undefined,
        district: (formData.get('district') as string) || undefined,
        neighborhood: (formData.get('neighborhood') as string) || undefined,
        minPrice: formData.get('minPrice') ? Number(formData.get('minPrice')) : undefined,
        maxPrice: formData.get('maxPrice') ? Number(formData.get('maxPrice')) : undefined,
        roomCount: (formData.get('roomCount') as string) || undefined,
        viewType: (formData.get('viewType') as 'sea' | 'city' | 'nature') || undefined,
        features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
      },
    };

    // Basic validation
    const hasCriteria = Object.values(data.criteria).some(
      (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
    );
    if (!data.rawText && !hasCriteria) {
      setError('Please provide either a description or some search criteria');
      return;
    }

    try {
      const created = await onSubmit(data);
      router.push(`/search-requests/${created.id}`);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.details && err.details.length > 0) {
          setError(err.details.join(', '));
        } else {
          setError(err.message || 'An error occurred');
        }
      } else {
        setError('An unexpected error occurred');
      }
    }
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Raw Text */}
      <Card>
        <CardHeader>
          <CardTitle>Request Description</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            name="rawText"
            placeholder="e.g., Looking for a 3+1 sea view apartment in Bodrum, budget up to 15 million TL, must have garden..."
            defaultValue={initialData?.rawText || ''}
            disabled={isLoading}
            className="min-h-[120px]"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Describe what the buyer is looking for in natural language.
          </p>
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="listingType"
              label="Type"
              defaultValue={initialData?.criteria.listingType || ''}
              disabled={isLoading}
              placeholder="Select type"
              options={[
                { value: '', label: 'Any' },
                ...LISTING_TYPES.map((type) => ({
                  value: type,
                  label: LISTING_TYPE_LABELS[type],
                })),
              ]}
            />

            <Select
              name="roomCount"
              label="Rooms"
              defaultValue={initialData?.criteria.roomCount || ''}
              disabled={isLoading}
              placeholder="Select rooms"
              options={[
                { value: '', label: 'Any' },
                ...ROOM_COUNTS.map((r) => ({ value: r, label: r })),
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              name="city"
              label="City"
              placeholder="e.g., Istanbul"
              defaultValue={initialData?.criteria.city || ''}
              disabled={isLoading}
            />

            <Input
              name="district"
              label="District"
              placeholder="e.g., Kadikoy"
              defaultValue={initialData?.criteria.district || ''}
              disabled={isLoading}
            />

            <Input
              name="neighborhood"
              label="Neighborhood"
              placeholder="e.g., Moda"
              defaultValue={initialData?.criteria.neighborhood || ''}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="minPrice"
              type="number"
              label="Min Budget"
              placeholder="1000000"
              defaultValue={initialData?.criteria.minPrice || ''}
              disabled={isLoading}
            />

            <Input
              name="maxPrice"
              type="number"
              label="Max Budget"
              placeholder="5000000"
              defaultValue={initialData?.criteria.maxPrice || ''}
              disabled={isLoading}
            />
          </div>

          <Select
            name="viewType"
            label="Preferred View"
            defaultValue={initialData?.criteria.viewType || ''}
            disabled={isLoading}
            placeholder="Select view"
            options={[
              { value: '', label: 'Any' },
              ...VIEW_TYPES.map((v) => ({
                value: v,
                label: VIEW_TYPE_LABELS[v],
              })),
            ]}
          />
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Required Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {LISTING_FEATURES.slice(0, 16).map((feature) => (
              <Checkbox
                key={feature}
                label={LISTING_FEATURE_LABELS[feature]}
                checked={selectedFeatures.includes(feature)}
                onChange={() => toggleFeature(feature)}
                disabled={isLoading}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Save Changes' : 'Create Search Request'}
        </Button>
      </div>
    </form>
  );
}
