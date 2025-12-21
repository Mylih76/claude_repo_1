'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/providers/auth-provider';
import { useListings } from '@/lib/hooks/use-listings';
import { useSearchRequests } from '@/lib/hooks/use-search-requests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatPrice, formatRelativeTime } from '@/lib/utils/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: listingsData, isLoading: listingsLoading } = useListings({ limit: 5 });
  const { data: searchRequestsData, isLoading: searchRequestsLoading } = useSearchRequests({ limit: 5 });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your real estate activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4 text-muted-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listingsLoading ? '-' : listingsData?.meta.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Search Requests</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4 text-muted-foreground"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchRequestsLoading ? '-' : searchRequestsData?.meta.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/listings/new">
              <Button size="sm" className="w-full">
                + New Listing
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/search-requests/new">
              <Button size="sm" variant="outline" className="w-full">
                + New Search Request
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent items */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Listings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Listings</CardTitle>
            <Link href="/listings">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {listingsLoading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : !listingsData?.data.length ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No listings yet.{' '}
                <Link href="/listings/new" className="text-primary hover:underline">
                  Create your first listing
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {listingsData.data.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {listing.district}, {listing.city}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      {formatPrice(listing.price)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Search Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Search Requests</CardTitle>
            <Link href="/search-requests">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {searchRequestsLoading ? (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            ) : !searchRequestsData?.data.length ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No search requests yet.{' '}
                <Link href="/search-requests/new" className="text-primary hover:underline">
                  Create your first search request
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {searchRequestsData.data.map((request) => (
                  <Link
                    key={request.id}
                    href={`/search-requests/${request.id}`}
                    className="block rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <p className="font-medium line-clamp-1">
                      {request.rawText || 'Search criteria'}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      {request.criteria.city && <span>{request.criteria.city}</span>}
                      {request.criteria.listingType && (
                        <span className="capitalize">{request.criteria.listingType}</span>
                      )}
                      <span>{formatRelativeTime(request.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
