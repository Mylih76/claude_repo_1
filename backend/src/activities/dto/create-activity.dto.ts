import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
  IsDateString,
} from 'class-validator';

export enum ActivityType {
  note = 'note',
  call = 'call',
  meeting = 'meeting',
  showing = 'showing',
  whatsapp = 'whatsapp',
  email = 'email',
  offer = 'offer',
}

export enum ActivityOutcome {
  completed = 'completed',
  no_answer = 'no_answer',
  rescheduled = 'rescheduled',
  cancelled = 'cancelled',
}

export class CreateActivityDto {
  @ApiPropertyOptional({ description: 'Related contact ID' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Related listing ID' })
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ApiProperty({ enum: ActivityType, example: 'call' })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiPropertyOptional({ example: 'Follow-up call' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Discussed pricing options' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ActivityOutcome })
  @IsOptional()
  @IsEnum(ActivityOutcome)
  outcome?: ActivityOutcome;

  @ApiPropertyOptional({ example: { duration: 15, notes: 'interested' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '2025-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: '2025-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
