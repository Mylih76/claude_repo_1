'use client';

import Link from 'next/link';
import type { SearchRequest } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/lib/utils/format';
import { SEARCH_REQUEST_STATUS_LABELS, type SearchRequestStatus } from '@/lib/utils/constants';

interface SearchRequestsTableProps {
  searchRequests: SearchRequest[];
}

function getStatusVariant(status?: string): 'default' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'active':
      return 'success';
    case 'fulfilled':
      return 'default';
    case 'paused':
      return 'warning';
    case 'expired':
      return 'destructive';
    default:
      return 'default';
  }
}

export function SearchRequestsTable({ searchRequests }: SearchRequestsTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Request
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Location
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {searchRequests.map((request) => (
            <tr
              key={request.id}
              className="transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/search-requests/${request.id}`}
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {request.rawText ? (
                    <span className="line-clamp-1">{request.rawText}</span>
                  ) : (
                    <span className="text-muted-foreground">Search criteria</span>
                  )}
                </Link>
                {request.criteria.listingType && (
                  <p className="text-sm text-muted-foreground capitalize">
                    {request.criteria.listingType}
                    {request.criteria.roomCount && ` | ${request.criteria.roomCount}`}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {[
                  request.criteria.neighborhood,
                  request.criteria.district,
                  request.criteria.city,
                ]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </td>
              <td className="px-4 py-3">
                {request.status && (
                  <Badge variant={getStatusVariant(request.status)}>
                    {SEARCH_REQUEST_STATUS_LABELS[request.status as SearchRequestStatus]}
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatRelativeTime(request.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
