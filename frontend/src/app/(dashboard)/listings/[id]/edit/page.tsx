'use client';

import { useParams, useRouter } from 'next/navigation';
import { useListing, useUpdateListing } from '@/lib/hooks/use-listings';
import { PageHeader } from '@/components/layout/page-header';
import { ListingForm } from '@/components/forms/listing-form';
import { Spinner } from '@/components/ui/spinner';
import type { CreateListingRequest } from '@/lib/api/types';

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: listing, isLoading: isLoadingListing, error } = useListing(id);
  const updateMutation = useUpdateListing();

  const handleSubmit = async (data: CreateListingRequest) => {
    const result = await updateMutation.mutateAsync({ id, data });
    router.push(`/listings/${id}`);
    return result;
  };

  if (isLoadingListing) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="space-y-4">
        <PageHeader title="Listing Not Found" backHref="/listings" />
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          This listing could not be found or you don&apos;t have permission to edit it.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Listing"
        description={listing.title}
        backHref={`/listings/${id}`}
      />
      <ListingForm
        initialData={listing}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
