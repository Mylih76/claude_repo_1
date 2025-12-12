import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ListingType, PropertyType, ListingStatus } from './create-listing.dto';

export class ListingFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ListingType, description: 'Filter by listing type (sale/rent)' })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional({ enum: PropertyType, description: 'Filter by property type' })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiPropertyOptional({ enum: ListingStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({ example: 'İstanbul', description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Kadıköy', description: 'Filter by district' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Caferağa', description: 'Filter by neighborhood' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 1000000, description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ example: 5000000, description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 80, description: 'Minimum size (m²)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSqm?: number;

  @ApiPropertyOptional({ example: 200, description: 'Maximum size (m²)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSqm?: number;

  @ApiPropertyOptional({ example: '3+1', description: 'Room count' })
  @IsOptional()
  @IsString()
  roomCount?: string;

  @ApiPropertyOptional({ example: true, description: 'Is furnished' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  furnished?: boolean;
}
