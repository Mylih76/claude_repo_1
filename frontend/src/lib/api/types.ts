// ============================================
// Common Types
// ============================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiError {
  errorCode: string;
  message: string;
  details?: string[];
}

// ============================================
// Auth Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// ============================================
// Listing Types
// ============================================

export type ListingType = 'sale' | 'rent';
export type PropertyType = 'apartment' | 'villa' | 'office' | 'land' | 'shop' | 'warehouse' | 'building';
export type ListingStatus = 'draft' | 'active' | 'sold' | 'rented' | 'inactive';
export type HeatingType = 'central' | 'individual' | 'floor' | 'ac' | 'stove' | 'none';
export type ViewType = 'sea' | 'city' | 'nature' | 'pool' | 'garden' | 'street' | 'none';
export type Currency = 'TRY' | 'USD' | 'EUR';

export interface ListingMedia {
  id: string;
  listingId: string;
  mediaType: 'image' | 'video' | 'document';
  url: string;
  thumbnailUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  sortOrder: number;
  isCover: boolean;
  createdAt: string;
}

export interface ListingListItem {
  id: string;
  title: string;
  price: string;
  city: string;
  district: string;
  listingType?: ListingType;
  propertyType?: PropertyType;
  status?: ListingStatus;
  roomCount?: string | null;
  netSqm?: number | null;
  createdAt?: string;
}

export interface ListingDetail {
  id: string;
  userId: string;
  listingType: ListingType;
  propertyType: PropertyType;
  status: ListingStatus;
  title: string;
  description: string | null;
  price: string;
  currency: Currency;
  grossSqm: number | null;
  netSqm: number | null;
  roomCount: string | null;
  buildingAge: number | null;
  floorNumber: number | null;
  totalFloors: number | null;
  isFurnished: boolean | null;
  heatingType: HeatingType | null;
  viewType: ViewType | null;
  isInComplex: boolean | null;
  dues: string | null;
  city: string;
  district: string;
  neighborhood: string | null;
  addressDetail?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  features: string[];
  media: ListingMedia[];
  user: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingRequest {
  listingType: ListingType;
  propertyType: PropertyType;
  title: string;
  description?: string;
  price: number;
  currency?: Currency;
  grossSqm?: number;
  netSqm?: number;
  roomCount?: string;
  buildingAge?: number;
  floorNumber?: number;
  totalFloors?: number;
  isFurnished?: boolean;
  heatingType?: HeatingType;
  viewType?: ViewType;
  isInComplex?: boolean;
  dues?: number;
  city: string;
  district: string;
  neighborhood?: string;
  addressDetail?: string;
  features?: string[];
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {
  status?: ListingStatus;
}

export interface ListingFilters {
  page?: number;
  limit?: number;
  listingType?: ListingType;
  city?: string;
  district?: string;
  neighborhood?: string;
  minPrice?: number;
  maxPrice?: number;
}

// ============================================
// Search Request Types
// ============================================

export type SearchRequestStatus = 'active' | 'paused' | 'fulfilled' | 'expired';

export interface SearchCriteria {
  city?: string;
  district?: string;
  neighborhood?: string;
  listingType?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  roomCount?: string;
  viewType?: ViewType;
  features?: string[];
  propertyTypes?: PropertyType[];
  sqmMin?: number;
  sqmMax?: number;
}

export interface SearchRequest {
  id: string;
  userId: string;
  rawText: string | null;
  criteria: SearchCriteria;
  status?: SearchRequestStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSearchRequestRequest {
  rawText?: string;
  criteria: SearchCriteria;
}

export interface UpdateSearchRequestRequest {
  rawText?: string;
  criteria?: SearchCriteria;
  status?: SearchRequestStatus;
}

export interface SearchRequestFilters {
  page?: number;
  limit?: number;
  status?: SearchRequestStatus;
}

// ============================================
// Match Types
// ============================================

export type MatchType = 'auto' | 'manual';
export type MatchStatus = 'new' | 'sent' | 'viewed' | 'interested' | 'rejected';

export interface ScoreBreakdown {
  location_match: number;
  price_match: number;
  size_match: number;
  features_match: number;
  room_match: number;
  total: number;
}

export interface Match {
  id: string;
  searchRequestId: string;
  listingId: string;
  matchType: MatchType;
  score: string;
  status: MatchStatus;
}

export interface MatchResult {
  match: Match;
  listing: ListingListItem & {
    roomCount: string | null;
    netSqm: number | null;
  };
  scoreBreakdown: ScoreBreakdown;
}

export interface MatchResponse {
  matches: MatchResult[];
  totalFound: number;
}
