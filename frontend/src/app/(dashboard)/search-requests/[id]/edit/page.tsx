'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSearchRequest, useUpdateSearchRequest } from '@/lib/hooks/use-search-requests';
import { PageHeader } from '@/components/layout/page-header';
import { SearchRequestForm } from '@/components/forms/search-request-form';
import { Spinner } from '@/components/ui/spinner';
import type { CreateSearchRequestRequest } from '@/lib/api/types';

export default function EditSearchRequestPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: searchRequest, isLoading: isLoadingRequest, error } = useSearchRequest(id);
  const updateMutation = useUpdateSearchRequest();

  const handleSubmit = async (data: CreateSearchRequestRequest) => {
    const result = await updateMutation.mutateAsync({ id, data });
    router.push(`/search-requests/${id}`);
    return result;
  };

  if (isLoadingRequest) {
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
        title="Edit Search Request"
        backHref={`/search-requests/${id}`}
      />
      <SearchRequestForm
        initialData={searchRequest}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}
