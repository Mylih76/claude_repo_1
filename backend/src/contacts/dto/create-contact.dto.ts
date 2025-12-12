import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export enum ContactSource {
  manual = 'manual',
  whatsapp = 'whatsapp',
  website = 'website',
  referral = 'referral',
}

export enum ContactType {
  buyer = 'buyer',
  seller = 'seller',
  tenant = 'tenant',
  landlord = 'landlord',
}

export enum ContactStatus {
  new = 'new',
  active = 'active',
  inactive = 'inactive',
  converted = 'converted',
  lost = 'lost',
}

export class CreateContactDto {
  @ApiProperty({ example: 'Ahmet Yılmaz' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'Please provide a valid phone number',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'ahmet@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: ContactSource, default: 'manual' })
  @IsOptional()
  @IsEnum(ContactSource)
  source?: ContactSource;

  @ApiPropertyOptional({ enum: ContactType, default: 'buyer' })
  @IsOptional()
  @IsEnum(ContactType)
  contactType?: ContactType;

  @ApiPropertyOptional({ enum: ContactStatus, default: 'new' })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @ApiPropertyOptional({ example: 'Customer looking for sea-view apartment' })
  @IsOptional()
  @IsString()
  notes?: string;
}
