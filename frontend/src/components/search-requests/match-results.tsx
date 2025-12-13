'use client';

import Link from 'next/link';
import type { MatchResult } from '@/lib/api/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils/format';

interface MatchResultsProps {
  matches: MatchResult[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-amber-500';
  return 'text-muted-foreground';
}

export function MatchResults({ matches }: MatchResultsProps) {
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <p className="text-muted-foreground">No matches found for this search request.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try adjusting the criteria or adding more listings to your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map(({ match, listing, scoreBreakdown }) => (
        <Card key={match.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex">
              {/* Score */}
              <div className="flex w-24 flex-col items-center justify-center bg-muted/50 p-4">
                <span className={`text-3xl font-bold ${getScoreColor(scoreBreakdown.total)}`}>
                  {Math.round(scoreBreakdown.total)}%
                </span>
                <span className="text-xs text-muted-foreground">Match</span>
              </div>

              {/* Listing Info */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/listings/${listing.id}`}
                      className="font-semibold hover:text-primary hover:underline"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {listing.district}, {listing.city}
                      {listing.roomCount && ` | ${listing.roomCount}`}
                      {listing.netSqm && ` | ${listing.netSqm} m²`}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatPrice(listing.price)}
                  </p>
                </div>

                {/* Score Breakdown */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    Location: {scoreBreakdown.location_match}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Price: {scoreBreakdown.price_match}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Size: {scoreBreakdown.size_match}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Rooms: {scoreBreakdown.room_match}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Features: {scoreBreakdown.features_match}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
