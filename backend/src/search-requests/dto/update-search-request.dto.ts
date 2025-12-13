import { PartialType } from '@nestjs/swagger';
import { CreateSearchRequestDto } from './create-search-request.dto';

export class UpdateSearchRequestDto extends PartialType(CreateSearchRequestDto) {}
