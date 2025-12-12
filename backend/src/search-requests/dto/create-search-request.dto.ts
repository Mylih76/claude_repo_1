import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  IsUUID,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchRequestSource {
  manual = 'manual',
  whatsapp = 'whatsapp',
  form = 'form',
}

export enum SearchRequestStatus {
  active = 'active',
  paused = 'paused',
  fulfilled = 'fulfilled',
  expired = 'expired',
}

export enum ListingType {
  sale = 'sale',
  rent = 'rent',
}

export class CreateSearchRequestDto {
  @ApiPropertyOptional({ description: 'Contact ID if linked to a customer' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ enum: SearchRequestSource, default: 'manual' })
  @IsOptional()
  @IsEnum(SearchRequestSource)
  source?: SearchRequestSource;

  @ApiPropertyOptional({ enum: SearchRequestStatus, default: 'active' })
  @IsOptional()
  @IsEnum(SearchRequestStatus)
  status?: SearchRequestStatus;

  @ApiPropertyOptional({
    example: 'Kadıköy veya Üsküdar\'da 3+1 daire arıyorum, 3 milyon TL bütçem var',
    description: 'Original text from customer (for AI parsing)',
  })
  @IsOptional()
  @IsString()
  rawText?: string;

  @ApiPropertyOptional({ enum: ListingType, example: 'sale' })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional({ example: ['apartment', 'villa'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyTypes?: string[];

  @ApiPropertyOptional({ example: 2000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budgetMin?: number;

  @ApiPropertyOptional({ example: 3500000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  budgetMax?: number;

  @ApiPropertyOptional({ example: 'TRY', default: 'TRY' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sqmMin?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sqmMax?: number;

  @ApiPropertyOptional({ example: '2+1' })
  @IsOptional()
  @IsString()
  roomCountMin?: string;

  @ApiPropertyOptional({ example: '3+1' })
  @IsOptional()
  @IsString()
  roomCountMax?: string;

  @ApiPropertyOptional({ example: ['İstanbul'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cities?: string[];

  @ApiPropertyOptional({ example: ['Kadıköy', 'Üsküdar'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  districts?: string[];

  @ApiPropertyOptional({ example: ['Caferağa', 'Moda'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  neighborhoods?: string[];

  @ApiPropertyOptional({ example: ['elevator', 'parking'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mustHaveFeatures?: string[];

  @ApiPropertyOptional({ example: ['pool', 'gym'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  niceToHaveFeatures?: string[];

  @ApiPropertyOptional({
    description: 'AI-parsed criteria JSON',
    example: {
      listing_type: 'sale',
      budget: { min: 2000000, max: 3500000, currency: 'TRY' },
      location: { cities: ['İstanbul'], districts: ['Kadıköy', 'Üsküdar'] },
      rooms: { min: '2+1', max: '3+1' },
      confidence: 0.85,
    },
  })
  @IsOptional()
  @IsObject()
  criteria?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'Customer prefers sea view if available' })
  @IsOptional()
  @IsString()
  notes?: string;
}
