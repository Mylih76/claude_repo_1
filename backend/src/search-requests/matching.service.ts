import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { SearchRequestsService } from './search-requests.service';
import { TextParserService, ExtractedCriteria } from './text-parser.service';
import { TextSimilarityService } from './text-similarity.service';
import { Listing, SearchRequest, Match, Prisma } from '@prisma/client';

interface ScoreBreakdown {
  location_match: number;
  price_match: number;
  size_match: number;
  features_match: number;
  room_match: number;
  text_similarity: number;
  total: number;
  // Debug info for transparency
  used_extracted_criteria?: boolean;
  extracted_from_text?: Partial<ExtractedCriteria>;
  [key: string]: number | boolean | Partial<ExtractedCriteria> | undefined;
}

interface MatchResult {
  match: Match;
  listing: Partial<Listing>;
  scoreBreakdown: ScoreBreakdown;
}

/**
 * Effective criteria after merging extracted and explicit values
 */
interface EffectiveCriteria {
  cities: string[];
  districts: string[];
  neighborhoods: string[];
  budgetMin?: number;
  budgetMax?: number;
  roomCountMin?: string;
  roomCountMax?: string;
  mustHaveFeatures: string[];
  niceToHaveFeatures: string[];
  listingType?: string;
  sqmMin?: number;
  sqmMax?: number;
}

@Injectable()
export class MatchingService {
  constructor(
    private prisma: PrismaService,
    private listingsService: ListingsService,
    private searchRequestsService: SearchRequestsService,
    private textParser: TextParserService,
    private textSimilarity: TextSimilarityService,
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

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: Parse rawText to extract criteria
    // ═══════════════════════════════════════════════════════════════
    const rawText = searchRequest.rawText || '';
    let extractedCriteria: ExtractedCriteria | null = null;

    if (rawText.trim().length > 0) {
      extractedCriteria = this.textParser.parse(rawText);
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Merge extracted criteria with explicit criteria
    // Explicit values always take precedence
    // ═══════════════════════════════════════════════════════════════
    const effectiveCriteria = this.mergeCriteria(
      searchRequest,
      extractedCriteria,
    );

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: Get listings (with softer filtering for rawText-only)
    // ═══════════════════════════════════════════════════════════════
    const hasExplicitCriteria = this.hasExplicitCriteria(searchRequest);
    const hasRawTextOnly = !hasExplicitCriteria && rawText.trim().length > 0;

    // If rawText-only, fetch ALL active listings (no hard filters)
    // Text similarity will do the ranking
    const listings = hasRawTextOnly
      ? await this.listingsService.findAllForMatching({
          listingType: effectiveCriteria.listingType || undefined,
        })
      : await this.listingsService.findAllForMatching({
          listingType: effectiveCriteria.listingType || undefined,
          cities: effectiveCriteria.cities,
          districts: effectiveCriteria.districts,
          neighborhoods: effectiveCriteria.neighborhoods,
          minPrice: effectiveCriteria.budgetMin,
          maxPrice: effectiveCriteria.budgetMax,
          minSqm: effectiveCriteria.sqmMin,
          maxSqm: effectiveCriteria.sqmMax,
          roomCountMin: effectiveCriteria.roomCountMin,
          roomCountMax: effectiveCriteria.roomCountMax,
          mustHaveFeatures: effectiveCriteria.mustHaveFeatures,
        });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: Calculate scores with rawText contribution
    // ═══════════════════════════════════════════════════════════════
    const matchResults: MatchResult[] = [];

    for (const listing of listings) {
      const scoreBreakdown = this.calculateScore(
        searchRequest,
        listing,
        rawText,
        effectiveCriteria,
        extractedCriteria,
      );

      // Dynamic threshold: lower for rawText-only searches
      const threshold = hasRawTextOnly ? 30 : 50;

      if (scoreBreakdown.total >= threshold) {
        // Check if match already exists
        const existingMatch = await this.prisma.match.findFirst({
          where: {
            searchRequestId,
            listingId: listing.id,
          },
        });

        let match: Match;

        if (existingMatch) {
          match = await this.prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              score: scoreBreakdown.total,
              scoreBreakdown: scoreBreakdown as unknown as Prisma.InputJsonValue,
              matchType: 'auto',
            },
          });
        } else {
          match = await this.prisma.match.create({
            data: {
              searchRequestId,
              listingId: listing.id,
              matchType: 'auto',
              score: scoreBreakdown.total,
              scoreBreakdown: scoreBreakdown as unknown as Prisma.InputJsonValue,
              status: 'new',
            },
          });
        }

        matchResults.push({
          match,
          listing: {
            id: listing.id,
            title: listing.title,
            description: listing.description,
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

  /**
   * Merge extracted criteria from rawText with explicit criteria
   * Explicit values always take precedence
   */
  private mergeCriteria(
    request: SearchRequest,
    extracted: ExtractedCriteria | null,
  ): EffectiveCriteria {
    const explicitCities = (request.cities as string[]) || [];
    const explicitDistricts = (request.districts as string[]) || [];
    const explicitNeighborhoods = (request.neighborhoods as string[]) || [];
    const explicitMustHave = (request.mustHaveFeatures as string[]) || [];
    const explicitNiceToHave = (request.niceToHaveFeatures as string[]) || [];

    return {
      // Location: use explicit if available, otherwise extracted
      cities:
        explicitCities.length > 0
          ? explicitCities
          : extracted?.cities || [],
      districts:
        explicitDistricts.length > 0
          ? explicitDistricts
          : extracted?.districts || [],
      neighborhoods:
        explicitNeighborhoods.length > 0
          ? explicitNeighborhoods
          : extracted?.neighborhoods || [],

      // Budget: use explicit if available, otherwise extracted
      budgetMin:
        request.budgetMin !== null
          ? Number(request.budgetMin)
          : extracted?.budgetMin,
      budgetMax:
        request.budgetMax !== null
          ? Number(request.budgetMax)
          : extracted?.budgetMax,

      // Room count: use explicit if available, otherwise extracted
      roomCountMin: request.roomCountMin || extracted?.roomCountMin,
      roomCountMax: request.roomCountMax || extracted?.roomCountMax,

      // Size: explicit only (not easily extracted from text)
      sqmMin: request.sqmMin || undefined,
      sqmMax: request.sqmMax || undefined,

      // Features: merge explicit with extracted
      mustHaveFeatures: [
        ...explicitMustHave,
        ...(extracted?.features || []).filter(
          (f) => !explicitMustHave.includes(f),
        ),
      ],
      niceToHaveFeatures: explicitNiceToHave,

      // Listing type: explicit wins
      listingType: request.listingType || extracted?.listingType,
    };
  }

  /**
   * Check if request has any explicit criteria (not just rawText)
   */
  private hasExplicitCriteria(request: SearchRequest): boolean {
    const cities = (request.cities as string[]) || [];
    const districts = (request.districts as string[]) || [];
    const mustHave = (request.mustHaveFeatures as string[]) || [];

    return (
      cities.length > 0 ||
      districts.length > 0 ||
      request.budgetMin !== null ||
      request.budgetMax !== null ||
      request.roomCountMin !== null ||
      request.sqmMin !== null
    );
  }

  /**
   * Calculate match score with rawText contribution
   *
   * Weight distribution:
   * - location: 25%
   * - price: 20%
   * - size: 15%
   * - room: 10%
   * - features: 10%
   * - text_similarity: 20%
   */
  private calculateScore(
    request: SearchRequest,
    listing: Listing,
    rawText: string,
    effectiveCriteria: EffectiveCriteria,
    extractedCriteria: ExtractedCriteria | null,
  ): ScoreBreakdown {
    // ═══════════════════════════════════════════════════════════════
    // TEXT SIMILARITY SCORE (0-100)
    // ═══════════════════════════════════════════════════════════════
    const textSimilarity = rawText.trim().length > 0
      ? this.textSimilarity.calculateSimilarity(
          rawText,
          listing.title,
          listing.description,
        )
      : 100; // No rawText = neutral (doesn't penalize)

    // ═══════════════════════════════════════════════════════════════
    // LOCATION MATCH (0-100)
    // ═══════════════════════════════════════════════════════════════
    let locationScore = 0;
    const { cities, districts, neighborhoods } = effectiveCriteria;

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

    // ═══════════════════════════════════════════════════════════════
    // PRICE MATCH (0-100)
    // ═══════════════════════════════════════════════════════════════
    let priceScore = 0;
    const listingPrice = Number(listing.price);
    const minBudget = effectiveCriteria.budgetMin || 0;
    const maxBudget = effectiveCriteria.budgetMax || Number.MAX_SAFE_INTEGER;

    if (!effectiveCriteria.budgetMin && !effectiveCriteria.budgetMax) {
      priceScore = 100; // No budget preference
    } else if (listingPrice >= minBudget && listingPrice <= maxBudget) {
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

    // ═══════════════════════════════════════════════════════════════
    // SIZE MATCH (0-100)
    // ═══════════════════════════════════════════════════════════════
    let sizeScore = 0;
    const listingSqm = listing.netSqm || listing.grossSqm || 0;
    const minSqm = effectiveCriteria.sqmMin || 0;
    const maxSqm = effectiveCriteria.sqmMax || Number.MAX_SAFE_INTEGER;

    if (!effectiveCriteria.sqmMin && !effectiveCriteria.sqmMax) {
      sizeScore = 100; // No size preference
    } else if (listingSqm >= minSqm && listingSqm <= maxSqm) {
      sizeScore = 100;
    } else if (listingSqm > maxSqm) {
      const overPercentage = ((listingSqm - maxSqm) / maxSqm) * 100;
      sizeScore = Math.max(0, 100 - overPercentage * 2);
    } else if (listingSqm < minSqm) {
      const underPercentage = ((minSqm - listingSqm) / minSqm) * 100;
      sizeScore = Math.max(0, 100 - underPercentage * 2);
    }

    // ═══════════════════════════════════════════════════════════════
    // ROOM MATCH (0-100)
    // ═══════════════════════════════════════════════════════════════
    let roomScore = 0;
    const requestedRoomMin = effectiveCriteria.roomCountMin;
    const requestedRoomMax = effectiveCriteria.roomCountMax;
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

    // ═══════════════════════════════════════════════════════════════
    // FEATURES MATCH (0-100)
    // ═══════════════════════════════════════════════════════════════
    let featuresScore = 0;
    const mustHaveFeatures = effectiveCriteria.mustHaveFeatures;
    const niceToHaveFeatures = effectiveCriteria.niceToHaveFeatures;
    const listingFeatures = (listing.features as string[]) || [];

    if (mustHaveFeatures.length === 0 && niceToHaveFeatures.length === 0) {
      featuresScore = 100; // No feature preference
    } else {
      // Must have features - 70 points
      if (mustHaveFeatures.length > 0) {
        const matchedMust = mustHaveFeatures.filter((f) =>
          listingFeatures.some(
            (lf) => lf.toLowerCase() === f.toLowerCase(),
          ),
        );
        featuresScore += (matchedMust.length / mustHaveFeatures.length) * 70;
      } else {
        featuresScore += 70;
      }

      // Nice to have features - 30 points
      if (niceToHaveFeatures.length > 0) {
        const matchedNice = niceToHaveFeatures.filter((f) =>
          listingFeatures.some(
            (lf) => lf.toLowerCase() === f.toLowerCase(),
          ),
        );
        featuresScore += (matchedNice.length / niceToHaveFeatures.length) * 30;
      } else {
        featuresScore += 30;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // CALCULATE TOTAL (weighted average)
    // ═══════════════════════════════════════════════════════════════
    const weights = {
      location: 0.25,
      price: 0.20,
      size: 0.15,
      room: 0.10,
      features: 0.10,
      text: 0.20,
    };

    const total = Math.round(
      locationScore * weights.location +
        priceScore * weights.price +
        sizeScore * weights.size +
        roomScore * weights.room +
        featuresScore * weights.features +
        textSimilarity * weights.text,
    );

    return {
      location_match: Math.round(locationScore),
      price_match: Math.round(priceScore),
      size_match: Math.round(sizeScore),
      features_match: Math.round(featuresScore),
      room_match: Math.round(roomScore),
      text_similarity: Math.round(textSimilarity),
      total,
      // Debug info
      used_extracted_criteria: extractedCriteria !== null,
      extracted_from_text: extractedCriteria
        ? {
            cities: extractedCriteria.cities,
            districts: extractedCriteria.districts,
            budgetMax: extractedCriteria.budgetMax,
            roomCountMin: extractedCriteria.roomCountMin,
            features: extractedCriteria.features,
          }
        : undefined,
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
