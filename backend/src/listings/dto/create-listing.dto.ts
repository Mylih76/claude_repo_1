import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ListingType {
  sale = 'sale',
  rent = 'rent',
}

export enum PropertyType {
  apartment = 'apartment',
  villa = 'villa',
  office = 'office',
  land = 'land',
  shop = 'shop',
  warehouse = 'warehouse',
  building = 'building',
}

export enum ListingStatus {
  draft = 'draft',
  active = 'active',
  sold = 'sold',
  rented = 'rented',
  inactive = 'inactive',
}

export enum HeatingType {
  central = 'central',
  individual = 'individual',
  floor = 'floor',
  ac = 'ac',
  stove = 'stove',
  none = 'none',
}

export enum ViewType {
  sea = 'sea',
  city = 'city',
  nature = 'nature',
  pool = 'pool',
  garden = 'garden',
  street = 'street',
  none = 'none',
}

export enum EntranceType {
  apartment = 'apartment',
  villa = 'villa',
  duplex = 'duplex',
  triplex = 'triplex',
}

export class CreateListingDto {
  @ApiProperty({ enum: ListingType, example: 'sale' })
  @IsEnum(ListingType)
  listingType: ListingType;

  @ApiProperty({ enum: PropertyType, example: 'apartment' })
  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @ApiPropertyOptional({ enum: ListingStatus, default: 'active' })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiProperty({ example: '3+1 Deniz Manzaralı Daire' })
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ example: 'Kadıköy merkezde, metro yakını...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2500000 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'TRY', default: 'TRY' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  grossSqm?: number;

  @ApiPropertyOptional({ example: 130 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  netSqm?: number;

  @ApiPropertyOptional({ example: '3+1' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  roomCount?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  buildingAge?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(-5)
  @Max(100)
  floorNumber?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(200)
  totalFloors?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isFurnished?: boolean;

  @ApiPropertyOptional({ enum: HeatingType })
  @IsOptional()
  @IsEnum(HeatingType)
  heatingType?: HeatingType;

  @ApiPropertyOptional({ enum: ViewType })
  @IsOptional()
  @IsEnum(ViewType)
  viewType?: ViewType;

  @ApiPropertyOptional({ enum: EntranceType })
  @IsOptional()
  @IsEnum(EntranceType)
  entranceType?: EntranceType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isInComplex?: boolean;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  dues?: number;

  @ApiProperty({ example: 'İstanbul' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Kadıköy' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  district: string;

  @ApiPropertyOptional({ example: 'Caferağa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'Moda Caddesi No: 123' })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional({ example: 40.9876 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 29.0234 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({
    example: ['elevator', 'parking', 'security'],
    description: 'List of features',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
