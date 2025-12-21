'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSearchRequest, useTriggerMatching, useDeleteSearchRequest } from '@/lib/hooks/use-search-requests';
import { PageHeader } from '@/components/layout/page-header';
import { MatchResults } from '@/components/search-requests';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils/format';
import {
  LISTING_TYPE_LABELS,
  LISTING_FEATURE_LABELS,
  type ListingType,
  type ListingFeature,
} from '@/lib/utils/constants';

export default function SearchRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: searchRequest, isLoading, error } = useSearchRequest(id);
  const matchMutation = useTriggerMatching(id);
  const deleteMutation = useDeleteSearchRequest();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      router.push('/search-requests');
    } catch {
      // Error handled by mutation
    }
  };

  const handleFindMatches = async () => {
    try {
      await matchMutation.mutateAsync();
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !searchRequest) {
    return (
      <div className="space-y-4">
        <PageHeader title="Search Request Not Found" backHref="/search-requests" />
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          This search request could not be found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Search Request"
        backHref="/search-requests"
      />

      {/* Action buttons */}
      <div className="mb-6 flex gap-2">
        <Link href={`/search-requests/${id}/edit`}>
          <Button variant="outline">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mr-2 h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
            Edit
          </Button>
        </Link>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete
        </Button>
      </div>

      <div className="space-y-6">
        {/* Raw Text */}
        {searchRequest.rawText && (
          <Card>
            <CardHeader>
              <CardTitle>Request Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{searchRequest.rawText}</p>
            </CardContent>
          </Card>
        )}

        {/* Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {searchRequest.listingType && (
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {LISTING_TYPE_LABELS[searchRequest.listingType as ListingType]}
                  </p>
                </div>
              )}
              {searchRequest.cities?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium">{searchRequest.cities.join(', ')}</p>
                </div>
              )}
              {searchRequest.districts?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">District</p>
                  <p className="font-medium">{searchRequest.districts.join(', ')}</p>
                </div>
              )}
              {searchRequest.neighborhoods?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Neighborhood</p>
                  <p className="font-medium">{searchRequest.neighborhoods.join(', ')}</p>
                </div>
              )}
              {(searchRequest.budgetMin || searchRequest.budgetMax) && (
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">
                    {searchRequest.budgetMin && formatPrice(Number(searchRequest.budgetMin))}
                    {searchRequest.budgetMin && searchRequest.budgetMax && ' - '}
                    {searchRequest.budgetMax && formatPrice(Number(searchRequest.budgetMax))}
                  </p>
                </div>
              )}
              {searchRequest.roomCountMin && (
                <div>
                  <p className="text-sm text-muted-foreground">Rooms</p>
                  <p className="font-medium">
                    {searchRequest.roomCountMin}
                    {searchRequest.roomCountMax && searchRequest.roomCountMax !== searchRequest.roomCountMin &&
                      ` - ${searchRequest.roomCountMax}`}
                  </p>
                </div>
              )}
            </div>

            {searchRequest.mustHaveFeatures?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-muted-foreground">Required Features</p>
                <div className="flex flex-wrap gap-2">
                  {searchRequest.mustHaveFeatures.map((feature) => (
                    <Badge key={feature} variant="outline">
                      {LISTING_FEATURE_LABELS[feature as ListingFeature] || feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Find Matches Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleFindMatches}
            isLoading={matchMutation.isPending}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mr-2 h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            Find Matching Listings
          </Button>
        </div>

        {/* Match Results */}
        {matchMutation.data && (
          <div>
            <h2 className="mb-4 text-lg font-semibold">
              Matches ({matchMutation.data.totalFound} found)
            </h2>
            <MatchResults matches={matchMutation.data.matches} />
          </div>
        )}

        {/* Timestamps */}
        <p className="text-sm text-muted-foreground">
          Created: {formatDate(searchRequest.createdAt)}
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Search Request"
        description="Are you sure you want to delete this search request? This action cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
