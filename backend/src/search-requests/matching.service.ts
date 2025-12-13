import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { SearchRequestsService } from './search-requests.service';
import { Listing, SearchRequest, Match, Prisma } from '@prisma/client';

interface ScoreBreakdown {
  location_match: number;
  price_match: number;
  size_match: number;
  features_match: number;
  room_match: number;
  total: number;
  [key: string]: number; // Add index signature for Prisma JSON compatibility
}

interface MatchResult {
  match: Match;
  listing: Partial<Listing>;
  scoreBreakdown: ScoreBreakdown;
}

@Injectable()
export class MatchingService {
  constructor(
    private prisma: PrismaService,
    private listingsService: ListingsService,
    private searchRequestsService: SearchRequestsService,
  ) {}

  async runMatching(
    userId: string,
    searchRequestId: string,
  ): Promise<{ matches: MatchResult[]; totalFound: number }> {
    // Get search request
    const searchRequest = await this.searchRequestsService.findOne(
      userId,
      searchRequestId,
    );

    if (!searchRequest) {
      throw new NotFoundException({
        errorCode: 'SEARCH_REQUEST_NOT_FOUND',
        message: 'Search request not found',
      });
    }

    // Get listings that pass hard filters
    const listings = await this.listingsService.findAllForMatching({
      listingType: searchRequest.listingType || undefined,
      cities: (searchRequest.cities as string[]) || [],
      districts: (searchRequest.districts as string[]) || [],
      neighborhoods: (searchRequest.neighborhoods as string[]) || [],
      minPrice: searchRequest.budgetMin
        ? Number(searchRequest.budgetMin)
        : undefined,
      maxPrice: searchRequest.budgetMax
        ? Number(searchRequest.budgetMax)
        : undefined,
      minSqm: searchRequest.sqmMin || undefined,
      maxSqm: searchRequest.sqmMax || undefined,
      roomCountMin: searchRequest.roomCountMin || undefined,
      roomCountMax: searchRequest.roomCountMax || undefined,
      mustHaveFeatures: (searchRequest.mustHaveFeatures as string[]) || [],
    });

    // Calculate scores and create matches
    const matchResults: MatchResult[] = [];

    for (const listing of listings) {
      const scoreBreakdown = this.calculateScore(searchRequest, listing);

      // Only include matches with score > 50
      if (scoreBreakdown.total >= 50) {
        // Check if match already exists
        const existingMatch = await this.prisma.match.findFirst({
          where: {
            searchRequestId,
            listingId: listing.id,
          },
        });

        let match: Match;

        if (existingMatch) {
          // Update existing match
          match = await this.prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              score: scoreBreakdown.total,
              scoreBreakdown: scoreBreakdown as Prisma.InputJsonValue,
              matchType: 'auto',
            },
          });
        } else {
          // Create new match
          match = await this.prisma.match.create({
            data: {
              searchRequestId,
              listingId: listing.id,
              matchType: 'auto',
              score: scoreBreakdown.total,
              scoreBreakdown: scoreBreakdown as Prisma.InputJsonValue,
              status: 'new',
            },
          });
        }

        matchResults.push({
          match,
          listing: {
            id: listing.id,
            title: listing.title,
            price: listing.price,
            city: listing.city,
            district: listing.district,
            neighborhood: listing.neighborhood,
            roomCount: listing.roomCount,
            netSqm: listing.netSqm,
            listingType: listing.listingType,
            propertyType: listing.propertyType,
          },
          scoreBreakdown,
        });
      }
    }

    // Sort by score descending
    matchResults.sort((a, b) => b.scoreBreakdown.total - a.scoreBreakdown.total);

    return {
      matches: matchResults,
      totalFound: matchResults.length,
    };
  }

  private calculateScore(
    request: SearchRequest,
    listing: Listing,
  ): ScoreBreakdown {
    let locationScore = 0;
    let priceScore = 0;
    let sizeScore = 0;
    let featuresScore = 0;
    let roomScore = 0;

    // Location Match (max 100)
    const cities = (request.cities as string[]) || [];
    const districts = (request.districts as string[]) || [];
    const neighborhoods = (request.neighborhoods as string[]) || [];

    if (cities.length === 0 && districts.length === 0) {
      locationScore = 100; // No location preference
    } else {
      if (
        cities.length === 0 ||
        cities.some(
          (c) => c.toLowerCase() === listing.city?.toLowerCase(),
        )
      ) {
        locationScore += 40;
      }
      if (
        districts.length === 0 ||
        districts.some(
          (d) => d.toLowerCase() === listing.district?.toLowerCase(),
        )
      ) {
        locationScore += 40;
      }
      if (
        neighborhoods.length === 0 ||
        neighborhoods.some(
          (n) => n.toLowerCase() === listing.neighborhood?.toLowerCase(),
        )
      ) {
        locationScore += 20;
      }
    }

    // Price Match (max 100)
    const listingPrice = Number(listing.price);
    const minBudget = request.budgetMin ? Number(request.budgetMin) : 0;
    const maxBudget = request.budgetMax
      ? Number(request.budgetMax)
      : Number.MAX_SAFE_INTEGER;

    if (listingPrice >= minBudget && listingPrice <= maxBudget) {
      priceScore = 100;
    } else if (listingPrice < minBudget) {
      // Under budget - good!
      priceScore = 100;
    } else {
      // Over budget - calculate how much over
      const overPercentage = ((listingPrice - maxBudget) / maxBudget) * 100;
      if (overPercentage <= 10) {
        priceScore = 80;
      } else if (overPercentage <= 20) {
        priceScore = 60;
      } else if (overPercentage <= 30) {
        priceScore = 40;
      } else {
        priceScore = 20;
      }
    }

    // Size Match (max 100)
    const listingSqm = listing.netSqm || listing.grossSqm || 0;
    const minSqm = request.sqmMin || 0;
    const maxSqm = request.sqmMax || Number.MAX_SAFE_INTEGER;

    if (listingSqm >= minSqm && listingSqm <= maxSqm) {
      sizeScore = 100;
    } else if (listingSqm > maxSqm) {
      const overPercentage = ((listingSqm - maxSqm) / maxSqm) * 100;
      sizeScore = Math.max(0, 100 - overPercentage * 2);
    } else if (listingSqm < minSqm) {
      const underPercentage = ((minSqm - listingSqm) / minSqm) * 100;
      sizeScore = Math.max(0, 100 - underPercentage * 2);
    }

    // Room Match (max 100)
    const requestedRoomMin = request.roomCountMin;
    const requestedRoomMax = request.roomCountMax;
    const listingRoom = listing.roomCount;

    if (!requestedRoomMin && !requestedRoomMax) {
      roomScore = 100; // No room preference
    } else if (!listingRoom) {
      roomScore = 50; // No room info on listing
    } else {
      const listingRoomNum = this.parseRoomCount(listingRoom);
      const minRoomNum = requestedRoomMin
        ? this.parseRoomCount(requestedRoomMin)
        : 0;
      const maxRoomNum = requestedRoomMax
        ? this.parseRoomCount(requestedRoomMax)
        : 10;

      if (listingRoomNum >= minRoomNum && listingRoomNum <= maxRoomNum) {
        roomScore = 100;
      } else {
        const diff = Math.min(
          Math.abs(listingRoomNum - minRoomNum),
          Math.abs(listingRoomNum - maxRoomNum),
        );
        roomScore = Math.max(0, 100 - diff * 25);
      }
    }

    // Features Match (max 100)
    const mustHaveFeatures = (request.mustHaveFeatures as string[]) || [];
    const niceToHaveFeatures = (request.niceToHaveFeatures as string[]) || [];
    const listingFeatures = (listing.features as string[]) || [];

    if (mustHaveFeatures.length === 0 && niceToHaveFeatures.length === 0) {
      featuresScore = 100; // No feature preference
    } else {
      // Must have features - 70 points
      if (mustHaveFeatures.length > 0) {
        const matchedMust = mustHaveFeatures.filter((f) =>
          listingFeatures.includes(f),
        );
        featuresScore += (matchedMust.length / mustHaveFeatures.length) * 70;
      } else {
        featuresScore += 70;
      }

      // Nice to have features - 30 points
      if (niceToHaveFeatures.length > 0) {
        const matchedNice = niceToHaveFeatures.filter((f) =>
          listingFeatures.includes(f),
        );
        featuresScore += (matchedNice.length / niceToHaveFeatures.length) * 30;
      } else {
        featuresScore += 30;
      }
    }

    // Calculate total (weighted average)
    const weights = {
      location: 0.3,
      price: 0.25,
      size: 0.2,
      room: 0.15,
      features: 0.1,
    };

    const total = Math.round(
      locationScore * weights.location +
        priceScore * weights.price +
        sizeScore * weights.size +
        roomScore * weights.room +
        featuresScore * weights.features,
    );

    return {
      location_match: Math.round(locationScore),
      price_match: Math.round(priceScore),
      size_match: Math.round(sizeScore),
      features_match: Math.round(featuresScore),
      room_match: Math.round(roomScore),
      total,
    };
  }

  private parseRoomCount(roomStr: string): number {
    // Parse room strings like "3+1", "2+1", "1+0"
    const match = roomStr.match(/^(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 0;
  }
}
