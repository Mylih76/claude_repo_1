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
    initialData?.mustHaveFeatures || []
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    // Get form values
    const rawText = (formData.get('rawText') as string) || undefined;
    const listingType = (formData.get('listingType') as 'sale' | 'rent') || undefined;
    const city = (formData.get('city') as string)?.trim() || undefined;
    const district = (formData.get('district') as string)?.trim() || undefined;
    const neighborhood = (formData.get('neighborhood') as string)?.trim() || undefined;
    const minPrice = formData.get('minPrice') ? Number(formData.get('minPrice')) : undefined;
    const maxPrice = formData.get('maxPrice') ? Number(formData.get('maxPrice')) : undefined;
    const roomCount = (formData.get('roomCount') as string) || undefined;

    // Build request matching backend DTO structure
    const data: CreateSearchRequestRequest = {
      rawText,
      listingType,
      // Convert single values to arrays for backend
      cities: city ? [city] : undefined,
      districts: district ? [district] : undefined,
      neighborhoods: neighborhood ? [neighborhood] : undefined,
      budgetMin: minPrice,
      budgetMax: maxPrice,
      roomCountMin: roomCount,
      roomCountMax: roomCount,
      mustHaveFeatures: selectedFeatures.length > 0 ? selectedFeatures : undefined,
    };

    // Basic validation
    const hasCriteria = data.listingType || data.cities?.length || data.districts?.length ||
      data.budgetMin || data.budgetMax || data.roomCountMin || data.mustHaveFeatures?.length;

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
              defaultValue={initialData?.listingType || ''}
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
              defaultValue={initialData?.roomCountMin || ''}
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
              defaultValue={initialData?.cities?.[0] || ''}
              disabled={isLoading}
            />

            <Input
              name="district"
              label="District"
              placeholder="e.g., Kadikoy"
              defaultValue={initialData?.districts?.[0] || ''}
              disabled={isLoading}
            />

            <Input
              name="neighborhood"
              label="Neighborhood"
              placeholder="e.g., Moda"
              defaultValue={initialData?.neighborhoods?.[0] || ''}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="minPrice"
              type="number"
              label="Min Budget"
              placeholder="1000000"
              defaultValue={initialData?.budgetMin || ''}
              disabled={isLoading}
            />

            <Input
              name="maxPrice"
              type="number"
              label="Max Budget"
              placeholder="5000000"
              defaultValue={initialData?.budgetMax || ''}
              disabled={isLoading}
            />
          </div>
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
