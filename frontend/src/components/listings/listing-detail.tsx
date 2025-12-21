'use client';

import type { ListingDetail } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, formatSqm, formatLocation, formatDate } from '@/lib/utils/format';
import {
  LISTING_STATUS_LABELS,
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  HEATING_TYPE_LABELS,
  VIEW_TYPE_LABELS,
  LISTING_FEATURE_LABELS,
  type ListingStatus,
  type ListingType,
  type PropertyType,
  type HeatingType,
  type ViewType,
  type ListingFeature,
} from '@/lib/utils/constants';

interface ListingDetailViewProps {
  listing: ListingDetail;
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'active':
      return 'success';
    case 'sold':
    case 'rented':
      return 'default';
    case 'draft':
      return 'warning';
    case 'inactive':
      return 'destructive';
    default:
      return 'default';
  }
}

export function ListingDetailView({ listing }: ListingDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {formatLocation(listing.city, listing.district, listing.neighborhood)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">
              {formatPrice(listing.price, listing.currency)}
            </p>
            {listing.dues && (
              <p className="text-sm text-muted-foreground">
                + {formatPrice(listing.dues, listing.currency)} dues/month
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={getStatusVariant(listing.status)}>
            {LISTING_STATUS_LABELS[listing.status as ListingStatus]}
          </Badge>
          <Badge variant="outline">
            {LISTING_TYPE_LABELS[listing.listingType as ListingType]}
          </Badge>
          <Badge variant="outline">
            {PROPERTY_TYPE_LABELS[listing.propertyType as PropertyType]}
          </Badge>
        </div>
      </div>

      {/* Key Details */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rooms</p>
            <p className="text-lg font-semibold">{listing.roomCount || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Net Area</p>
            <p className="text-lg font-semibold">{formatSqm(listing.netSqm)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Gross Area</p>
            <p className="text-lg font-semibold">{formatSqm(listing.grossSqm)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Building Age</p>
            <p className="text-lg font-semibold">
              {listing.buildingAge != null ? `${listing.buildingAge} years` : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {listing.description && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 font-semibold">Description</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {listing.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Property Details */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 font-semibold">Property Details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Floor</p>
              <p>
                {listing.floorNumber != null
                  ? `${listing.floorNumber} / ${listing.totalFloors || '?'}`
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Heating</p>
              <p>
                {listing.heatingType
                  ? HEATING_TYPE_LABELS[listing.heatingType as HeatingType]
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">View</p>
              <p>
                {listing.viewType
                  ? VIEW_TYPE_LABELS[listing.viewType as ViewType]
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Furnished</p>
              <p>
                {listing.isFurnished === true
                  ? 'Yes'
                  : listing.isFurnished === false
                  ? 'No'
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Complex</p>
              <p>
                {listing.isInComplex === true
                  ? 'Yes'
                  : listing.isInComplex === false
                  ? 'No'
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      {listing.features && listing.features.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold">Features</h3>
            <div className="flex flex-wrap gap-2">
              {listing.features.map((feature) => (
                <Badge key={feature} variant="outline">
                  {LISTING_FEATURE_LABELS[feature as ListingFeature] || feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Info */}
      <Card>
        <CardContent className="p-4">
          <h3 className="mb-4 font-semibold">Listed By</h3>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
              {listing.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{listing.user.name}</p>
              <p className="text-sm text-muted-foreground">{listing.user.email}</p>
              {listing.user.phone && (
                <p className="text-sm text-muted-foreground">{listing.user.phone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <p className="text-sm text-muted-foreground">
        Created: {formatDate(listing.createdAt)}
        {listing.updatedAt && ` | Updated: ${formatDate(listing.updatedAt)}`}
      </p>
    </div>
  );
}
