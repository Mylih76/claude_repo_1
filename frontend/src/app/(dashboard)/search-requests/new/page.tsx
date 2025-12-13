'use client';

import { useCreateSearchRequest } from '@/lib/hooks/use-search-requests';
import { PageHeader } from '@/components/layout/page-header';
import { SearchRequestForm } from '@/components/forms/search-request-form';

export default function NewSearchRequestPage() {
  const createMutation = useCreateSearchRequest();

  return (
    <div>
      <PageHeader
        title="Create Search Request"
        description="Define buyer requirements to find matching listings"
        backHref="/search-requests"
      />
      <SearchRequestForm
        onSubmit={createMutation.mutateAsync}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
