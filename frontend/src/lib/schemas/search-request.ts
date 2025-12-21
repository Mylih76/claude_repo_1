import { z } from 'zod';
import {
  LISTING_TYPES,
  PROPERTY_TYPES,
  ROOM_COUNTS,
} from '@/lib/utils/constants';

// Matches backend CreateSearchRequestDto
export const createSearchRequestSchema = z.object({
  rawText: z.string().max(2000, 'Text must be less than 2000 characters').optional(),
  listingType: z.enum(LISTING_TYPES).optional(),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  currency: z.string().optional(),
  sqmMin: z.number().int().positive().optional(),
  sqmMax: z.number().int().positive().optional(),
  roomCountMin: z.enum(ROOM_COUNTS).optional(),
  roomCountMax: z.enum(ROOM_COUNTS).optional(),
  cities: z.array(z.string()).optional(),
  districts: z.array(z.string()).optional(),
  neighborhoods: z.array(z.string()).optional(),
  mustHaveFeatures: z.array(z.string()).optional(),
  niceToHaveFeatures: z.array(z.string()).optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // At least rawText or some criteria must be provided
    const hasCriteria = data.listingType ||
      data.cities?.length ||
      data.districts?.length ||
      data.budgetMin ||
      data.budgetMax ||
      data.roomCountMin ||
      data.mustHaveFeatures?.length;
    return data.rawText || hasCriteria;
  },
  {
    message: 'Please provide either a description or some search criteria',
    path: ['rawText'],
  }
);

export type CreateSearchRequestFormData = z.infer<typeof createSearchRequestSchema>;

export const updateSearchRequestSchema = createSearchRequestSchema.partial();

export type UpdateSearchRequestFormData = z.infer<typeof updateSearchRequestSchema>;
