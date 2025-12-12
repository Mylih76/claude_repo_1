import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingFilterDto } from './dto/listing-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Listings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new listing' })
  @ApiResponse({
    status: 201,
    description: 'Listing created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        listingType: 'sale',
        propertyType: 'apartment',
        status: 'active',
        title: '3+1 Deniz Manzaralı Daire',
        description: 'Kadıköy merkezde...',
        price: '2500000',
        currency: 'TRY',
        city: 'İstanbul',
        district: 'Kadıköy',
        neighborhood: 'Caferağa',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateListingDto,
  ) {
    return this.listingsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all listings with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of listings',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: '3+1 Deniz Manzaralı Daire',
            price: '2500000',
            city: 'İstanbul',
            district: 'Kadıköy',
          },
        ],
        meta: {
          total: 50,
          page: 1,
          limit: 20,
          totalPages: 3,
        },
      },
    },
  })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() filter: ListingFilterDto,
  ) {
    return this.listingsService.findAll(user.userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a listing by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Listing details' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your listing' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listingsService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a listing' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Listing updated successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your listing' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a listing (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Listing deleted successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your listing' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listingsService.remove(user.userId, id);
  }
}
