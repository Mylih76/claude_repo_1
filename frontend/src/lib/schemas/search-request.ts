import { z } from 'zod';
import {
  LISTING_TYPES,
  PROPERTY_TYPES,
  VIEW_TYPES,
  ROOM_COUNTS,
} from '@/lib/utils/constants';

export const searchCriteriaSchema = z.object({
  city: z.string().optional(),
  district: z.string().optional(),
  neighborhood: z.string().optional(),
  listingType: z.enum(LISTING_TYPES).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  roomCount: z.enum(ROOM_COUNTS).optional(),
  viewType: z.enum(VIEW_TYPES).optional(),
  features: z.array(z.string()).optional(),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)).optional(),
  sqmMin: z.number().int().positive().optional(),
  sqmMax: z.number().int().positive().optional(),
});

export type SearchCriteriaFormData = z.infer<typeof searchCriteriaSchema>;

export const createSearchRequestSchema = z.object({
  rawText: z.string().max(2000, 'Text must be less than 2000 characters').optional(),
  criteria: searchCriteriaSchema,
}).refine(
  (data) => {
    // At least rawText or some criteria must be provided
    const hasCriteria = Object.values(data.criteria).some(
      (v) => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)
    );
    return data.rawText || hasCriteria;
  },
  {
    message: 'Please provide either a description or some search criteria',
    path: ['rawText'],
  }
);

export type CreateSearchRequestFormData = z.infer<typeof createSearchRequestSchema>;

export const updateSearchRequestSchema = z.object({
  rawText: z.string().max(2000).optional(),
  criteria: searchCriteriaSchema.optional(),
});

export type UpdateSearchRequestFormData = z.infer<typeof updateSearchRequestSchema>;
