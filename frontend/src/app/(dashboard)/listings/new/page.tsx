'use client';

import { useCreateListing } from '@/lib/hooks/use-listings';
import { PageHeader } from '@/components/layout/page-header';
import { ListingForm } from '@/components/forms/listing-form';

export default function NewListingPage() {
  const createMutation = useCreateListing();

  return (
    <div>
      <PageHeader
        title="Create New Listing"
        description="Add a new property to your portfolio"
        backHref="/listings"
      />
      <ListingForm
        onSubmit={createMutation.mutateAsync}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
