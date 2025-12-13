import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum SearchRequestStatus {
  active = 'active',
  paused = 'paused',
  fulfilled = 'fulfilled',
  expired = 'expired',
}

export class UpdateStatusDto {
  @ApiProperty({
    enum: SearchRequestStatus,
    example: 'paused',
    description: 'New status for the search request'
  })
  @IsEnum(SearchRequestStatus)
  status: SearchRequestStatus;
}
