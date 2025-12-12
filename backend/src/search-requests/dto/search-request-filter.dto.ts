import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchRequestStatus, ListingType } from './create-search-request.dto';

export class SearchRequestFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: SearchRequestStatus })
  @IsOptional()
  @IsEnum(SearchRequestStatus)
  status?: SearchRequestStatus;

  @ApiPropertyOptional({ enum: ListingType })
  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @ApiPropertyOptional({ description: 'Filter by contact ID' })
  @IsOptional()
  @IsUUID()
  contactId?: string;
}
