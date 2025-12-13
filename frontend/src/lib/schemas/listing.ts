import { z } from 'zod';
import {
  LISTING_TYPES,
  PROPERTY_TYPES,
  CURRENCIES,
  ROOM_COUNTS,
  HEATING_TYPES,
  VIEW_TYPES,
} from '@/lib/utils/constants';

export const createListingSchema = z.object({
  listingType: z.enum(LISTING_TYPES, {
    message: 'Listing type is required',
  }),
  propertyType: z.enum(PROPERTY_TYPES, {
    message: 'Property type is required',
  }),
  title: z
    .string()
    .min(1, 'Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  price: z
    .number({ message: 'Price is required and must be a number' })
    .positive('Price must be greater than 0'),
  currency: z.enum(CURRENCIES).default('TRY'),
  grossSqm: z
    .number()
    .int('Must be a whole number')
    .positive('Must be greater than 0')
    .optional(),
  netSqm: z
    .number()
    .int('Must be a whole number')
    .positive('Must be greater than 0')
    .optional(),
  roomCount: z.enum(ROOM_COUNTS).optional(),
  buildingAge: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .max(100, 'Building age seems too high')
    .optional(),
  floorNumber: z
    .number()
    .int('Must be a whole number')
    .min(-2, 'Floor cannot be lower than -2')
    .optional(),
  totalFloors: z
    .number()
    .int('Must be a whole number')
    .positive('Must be greater than 0')
    .max(200, 'Total floors seems too high')
    .optional(),
  isFurnished: z.boolean().optional(),
  heatingType: z.enum(HEATING_TYPES).optional(),
  viewType: z.enum(VIEW_TYPES).optional(),
  isInComplex: z.boolean().optional(),
  dues: z
    .number()
    .min(0, 'Dues cannot be negative')
    .optional(),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  neighborhood: z.string().optional(),
  addressDetail: z.string().max(500, 'Address detail must be less than 500 characters').optional(),
  features: z.array(z.string()).default([]),
});

export type CreateListingFormData = z.infer<typeof createListingSchema>;

export const updateListingSchema = createListingSchema.partial();

export type UpdateListingFormData = z.infer<typeof updateListingSchema>;

// Helper to convert form data to API request
export function formDataToCreateRequest(data: CreateListingFormData) {
  return {
    ...data,
    description: data.description || undefined,
    grossSqm: data.grossSqm || undefined,
    netSqm: data.netSqm || undefined,
    roomCount: data.roomCount || undefined,
    buildingAge: data.buildingAge || undefined,
    floorNumber: data.floorNumber || undefined,
    totalFloors: data.totalFloors || undefined,
    isFurnished: data.isFurnished ?? undefined,
    heatingType: data.heatingType || undefined,
    viewType: data.viewType || undefined,
    isInComplex: data.isInComplex ?? undefined,
    dues: data.dues || undefined,
    neighborhood: data.neighborhood || undefined,
    addressDetail: data.addressDetail || undefined,
    features: data.features.length > 0 ? data.features : undefined,
  };
}
