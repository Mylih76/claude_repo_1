'use client';

import Link from 'next/link';
import type { ListingListItem } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatLocation } from '@/lib/utils/format';
import {
  LISTING_STATUS_LABELS,
  LISTING_TYPE_LABELS,
  type ListingStatus,
  type ListingType,
} from '@/lib/utils/constants';

interface ListingsTableProps {
  listings: ListingListItem[];
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

export function ListingsTable({ listings }: ListingsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Title
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Type
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Price
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Location
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {listings.map((listing) => (
            <tr
              key={listing.id}
              className="transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/listings/${listing.id}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {listing.title}
                </Link>
                {listing.roomCount && (
                  <p className="text-sm text-muted-foreground">
                    {listing.roomCount}
                    {listing.netSqm && ` | ${listing.netSqm} m²`}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="capitalize text-sm">
                  {listing.listingType
                    ? LISTING_TYPE_LABELS[listing.listingType as ListingType]
                    : '-'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="font-semibold">{formatPrice(listing.price)}</span>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatLocation(listing.city, listing.district)}
              </td>
              <td className="px-4 py-3">
                {listing.status && (
                  <Badge variant={getStatusVariant(listing.status)}>
                    {LISTING_STATUS_LABELS[listing.status as ListingStatus]}
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
