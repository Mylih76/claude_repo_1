// Listing Types
export const LISTING_TYPES = ['sale', 'rent'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  sale: 'Sale',
  rent: 'Rent',
};

// Property Types
export const PROPERTY_TYPES = [
  'apartment',
  'villa',
  'office',
  'land',
  'shop',
  'warehouse',
  'building',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  office: 'Office',
  land: 'Land',
  shop: 'Shop',
  warehouse: 'Warehouse',
  building: 'Building',
};

// Listing Status
export const LISTING_STATUSES = [
  'draft',
  'active',
  'sold',
  'rented',
  'inactive',
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  sold: 'Sold',
  rented: 'Rented',
  inactive: 'Inactive',
};

// Room Counts
export const ROOM_COUNTS = [
  '1+0',
  '1+1',
  '2+1',
  '3+1',
  '4+1',
  '4+2',
  '5+1',
  '5+2',
  '6+',
] as const;
export type RoomCount = (typeof ROOM_COUNTS)[number];

// Heating Types
export const HEATING_TYPES = [
  'central',
  'individual',
  'floor',
  'ac',
  'stove',
  'none',
] as const;
export type HeatingType = (typeof HEATING_TYPES)[number];

export const HEATING_TYPE_LABELS: Record<HeatingType, string> = {
  central: 'Central Heating',
  individual: 'Individual Heating',
  floor: 'Floor Heating',
  ac: 'Air Conditioning',
  stove: 'Stove',
  none: 'None',
};

// View Types
export const VIEW_TYPES = [
  'sea',
  'city',
  'nature',
  'pool',
  'garden',
  'street',
  'none',
] as const;
export type ViewType = (typeof VIEW_TYPES)[number];

export const VIEW_TYPE_LABELS: Record<ViewType, string> = {
  sea: 'Sea View',
  city: 'City View',
  nature: 'Nature View',
  pool: 'Pool View',
  garden: 'Garden View',
  street: 'Street View',
  none: 'No View',
};

// Currencies
export const CURRENCIES = ['TRY', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
};

// Listing Features
export const LISTING_FEATURES = [
  'elevator',
  'parking',
  'closed_parking',
  'security',
  'generator',
  'fire_escape',
  'balcony',
  'terrace',
  'storage',
  'dressing_room',
  'laundry_room',
  'built_in_kitchen',
  'steel_door',
  'pool',
  'gym',
  'sauna',
  'playground',
  'garden',
  'bbq_area',
  'doorman',
  'caretaker',
  'fiber_internet',
  'satellite',
  'air_conditioning',
  'furnished',
  'white_goods',
  'pets_allowed',
] as const;
export type ListingFeature = (typeof LISTING_FEATURES)[number];

export const LISTING_FEATURE_LABELS: Record<ListingFeature, string> = {
  elevator: 'Elevator',
  parking: 'Parking',
  closed_parking: 'Closed Parking',
  security: 'Security',
  generator: 'Generator',
  fire_escape: 'Fire Escape',
  balcony: 'Balcony',
  terrace: 'Terrace',
  storage: 'Storage',
  dressing_room: 'Dressing Room',
  laundry_room: 'Laundry Room',
  built_in_kitchen: 'Built-in Kitchen',
  steel_door: 'Steel Door',
  pool: 'Pool',
  gym: 'Gym',
  sauna: 'Sauna',
  playground: 'Playground',
  garden: 'Garden',
  bbq_area: 'BBQ Area',
  doorman: 'Doorman',
  caretaker: 'Caretaker',
  fiber_internet: 'Fiber Internet',
  satellite: 'Satellite',
  air_conditioning: 'Air Conditioning',
  furnished: 'Furnished',
  white_goods: 'White Goods',
  pets_allowed: 'Pets Allowed',
};

// Match Status
export const MATCH_STATUSES = [
  'new',
  'sent',
  'viewed',
  'interested',
  'rejected',
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  new: 'New',
  sent: 'Sent',
  viewed: 'Viewed',
  interested: 'Interested',
  rejected: 'Rejected',
};

// Search Request Status
export const SEARCH_REQUEST_STATUSES = [
  'active',
  'paused',
  'fulfilled',
  'expired',
] as const;
export type SearchRequestStatus = (typeof SEARCH_REQUEST_STATUSES)[number];

export const SEARCH_REQUEST_STATUS_LABELS: Record<SearchRequestStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  fulfilled: 'Fulfilled',
  expired: 'Expired',
};

// API Error Codes
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
