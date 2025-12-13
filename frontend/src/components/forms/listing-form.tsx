'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiClientError } from '@/lib/api/client';
import {
  createListingSchema,
  type CreateListingFormData,
  formDataToCreateRequest,
} from '@/lib/schemas/listing';
import type { ListingDetail, CreateListingRequest } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LISTING_TYPES,
  LISTING_TYPE_LABELS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  CURRENCIES,
  ROOM_COUNTS,
  HEATING_TYPES,
  HEATING_TYPE_LABELS,
  VIEW_TYPES,
  VIEW_TYPE_LABELS,
  LISTING_FEATURES,
  LISTING_FEATURE_LABELS,
} from '@/lib/utils/constants';

interface ListingFormProps {
  initialData?: ListingDetail;
  onSubmit: (data: CreateListingRequest) => Promise<ListingDetail>;
  isLoading?: boolean;
}

export function ListingForm({ initialData, onSubmit, isLoading = false }: ListingFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateListingFormData, string>>>({});
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    initialData?.features || []
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    const data: CreateListingFormData = {
      listingType: formData.get('listingType') as CreateListingFormData['listingType'],
      propertyType: formData.get('propertyType') as CreateListingFormData['propertyType'],
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      price: parseFloat(formData.get('price') as string),
      currency: (formData.get('currency') as CreateListingFormData['currency']) || 'TRY',
      grossSqm: formData.get('grossSqm') ? parseInt(formData.get('grossSqm') as string) : undefined,
      netSqm: formData.get('netSqm') ? parseInt(formData.get('netSqm') as string) : undefined,
      roomCount: (formData.get('roomCount') as CreateListingFormData['roomCount']) || undefined,
      buildingAge: formData.get('buildingAge') ? parseInt(formData.get('buildingAge') as string) : undefined,
      floorNumber: formData.get('floorNumber') ? parseInt(formData.get('floorNumber') as string) : undefined,
      totalFloors: formData.get('totalFloors') ? parseInt(formData.get('totalFloors') as string) : undefined,
      isFurnished: formData.get('isFurnished') === 'on' ? true : undefined,
      heatingType: (formData.get('heatingType') as CreateListingFormData['heatingType']) || undefined,
      viewType: (formData.get('viewType') as CreateListingFormData['viewType']) || undefined,
      isInComplex: formData.get('isInComplex') === 'on' ? true : undefined,
      dues: formData.get('dues') ? parseFloat(formData.get('dues') as string) : undefined,
      city: formData.get('city') as string,
      district: formData.get('district') as string,
      neighborhood: (formData.get('neighborhood') as string) || undefined,
      features: selectedFeatures,
    };

    // Validate
    const result = createListingSchema.safeParse(data);
    if (!result.success) {
      const errors: Partial<Record<keyof CreateListingFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateListingFormData;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      const requestData = formDataToCreateRequest(result.data);
      const created = await onSubmit(requestData);
      router.push(`/listings/${created.id}`);
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

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            name="title"
            label="Title *"
            placeholder="e.g., 3+1 Sea View Apartment in Kadikoy"
            defaultValue={initialData?.title}
            error={fieldErrors.title}
            disabled={isLoading}
          />

          <Textarea
            name="description"
            label="Description"
            placeholder="Describe the property..."
            defaultValue={initialData?.description || ''}
            error={fieldErrors.description}
            disabled={isLoading}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="listingType"
              label="Listing Type *"
              defaultValue={initialData?.listingType || ''}
              error={fieldErrors.listingType}
              disabled={isLoading}
              placeholder="Select type"
              options={LISTING_TYPES.map((type) => ({
                value: type,
                label: LISTING_TYPE_LABELS[type],
              }))}
            />

            <Select
              name="propertyType"
              label="Property Type *"
              defaultValue={initialData?.propertyType || ''}
              error={fieldErrors.propertyType}
              disabled={isLoading}
              placeholder="Select type"
              options={PROPERTY_TYPES.map((type) => ({
                value: type,
                label: PROPERTY_TYPE_LABELS[type],
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Price & Size */}
      <Card>
        <CardHeader>
          <CardTitle>Price & Size</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              name="price"
              type="number"
              label="Price *"
              placeholder="2500000"
              defaultValue={initialData?.price || ''}
              error={fieldErrors.price}
              disabled={isLoading}
            />

            <Select
              name="currency"
              label="Currency"
              defaultValue={initialData?.currency || 'TRY'}
              disabled={isLoading}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />

            <Input
              name="dues"
              type="number"
              label="Monthly Dues"
              placeholder="1500"
              defaultValue={initialData?.dues || ''}
              error={fieldErrors.dues}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              name="grossSqm"
              type="number"
              label="Gross m²"
              placeholder="150"
              defaultValue={initialData?.grossSqm || ''}
              error={fieldErrors.grossSqm}
              disabled={isLoading}
            />

            <Input
              name="netSqm"
              type="number"
              label="Net m²"
              placeholder="130"
              defaultValue={initialData?.netSqm || ''}
              error={fieldErrors.netSqm}
              disabled={isLoading}
            />

            <Select
              name="roomCount"
              label="Rooms"
              defaultValue={initialData?.roomCount || ''}
              disabled={isLoading}
              placeholder="Select"
              options={[
                { value: '', label: 'Not specified' },
                ...ROOM_COUNTS.map((r) => ({ value: r, label: r })),
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              name="city"
              label="City *"
              placeholder="Istanbul"
              defaultValue={initialData?.city || ''}
              error={fieldErrors.city}
              disabled={isLoading}
            />

            <Input
              name="district"
              label="District *"
              placeholder="Kadikoy"
              defaultValue={initialData?.district || ''}
              error={fieldErrors.district}
              disabled={isLoading}
            />

            <Input
              name="neighborhood"
              label="Neighborhood"
              placeholder="Moda"
              defaultValue={initialData?.neighborhood || ''}
              error={fieldErrors.neighborhood}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              name="buildingAge"
              type="number"
              label="Building Age (years)"
              placeholder="5"
              defaultValue={initialData?.buildingAge || ''}
              error={fieldErrors.buildingAge}
              disabled={isLoading}
            />

            <Input
              name="floorNumber"
              type="number"
              label="Floor Number"
              placeholder="8"
              defaultValue={initialData?.floorNumber || ''}
              error={fieldErrors.floorNumber}
              disabled={isLoading}
            />

            <Input
              name="totalFloors"
              type="number"
              label="Total Floors"
              placeholder="12"
              defaultValue={initialData?.totalFloors || ''}
              error={fieldErrors.totalFloors}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="heatingType"
              label="Heating Type"
              defaultValue={initialData?.heatingType || ''}
              disabled={isLoading}
              placeholder="Select"
              options={[
                { value: '', label: 'Not specified' },
                ...HEATING_TYPES.map((h) => ({
                  value: h,
                  label: HEATING_TYPE_LABELS[h],
                })),
              ]}
            />

            <Select
              name="viewType"
              label="View Type"
              defaultValue={initialData?.viewType || ''}
              disabled={isLoading}
              placeholder="Select"
              options={[
                { value: '', label: 'Not specified' },
                ...VIEW_TYPES.map((v) => ({
                  value: v,
                  label: VIEW_TYPE_LABELS[v],
                })),
              ]}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <Checkbox
              name="isFurnished"
              label="Furnished"
              defaultChecked={initialData?.isFurnished || false}
              disabled={isLoading}
            />

            <Checkbox
              name="isInComplex"
              label="In a Complex/Site"
              defaultChecked={initialData?.isInComplex || false}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {LISTING_FEATURES.map((feature) => (
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
          {initialData ? 'Save Changes' : 'Create Listing'}
        </Button>
      </div>
    </form>
  );
}
