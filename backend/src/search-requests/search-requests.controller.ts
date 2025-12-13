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
import { SearchRequestsService } from './search-requests.service';
import { MatchingService } from './matching.service';
import { CreateSearchRequestDto } from './dto/create-search-request.dto';
import { UpdateSearchRequestDto } from './dto/update-search-request.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SearchRequestFilterDto } from './dto/search-request-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Search Requests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('search-requests')
export class SearchRequestsController {
  constructor(
    private readonly searchRequestsService: SearchRequestsService,
    private readonly matchingService: MatchingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new search request (customer inquiry)' })
  @ApiResponse({
    status: 201,
    description: 'Search request created',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        rawText: 'Kadıköy veya Üsküdar\'da 3+1 daire arıyorum, 3 milyon TL bütçem var',
        listingType: 'sale',
        budgetMin: 2000000,
        budgetMax: 3500000,
        districts: ['Kadıköy', 'Üsküdar'],
        criteria: {
          listing_type: 'sale',
          budget: { min: 2000000, max: 3500000 },
        },
        createdAt: '2025-01-01T00:00:00.000Z',
      },
    },
  })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSearchRequestDto,
  ) {
    return this.searchRequestsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all search requests with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of search requests',
  })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() filter: SearchRequestFilterDto,
  ) {
    return this.searchRequestsService.findAll(user.userId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a search request by ID with matches' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Search request details with matches' })
  @ApiResponse({ status: 404, description: 'Search request not found' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.searchRequestsService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update search request criteria' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Search request updated successfully' })
  @ApiResponse({ status: 404, description: 'Search request not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your search request' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSearchRequestDto,
  ) {
    return this.searchRequestsService.update(user.userId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update search request status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'paused',
        updatedAt: '2025-12-13T12:00:00.000Z'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Search request not found' })
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.searchRequestsService.updateStatus(user.userId, id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete search request (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Search request deleted successfully',
    schema: {
      example: {
        message: 'Search request deleted successfully'
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Search request not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your search request' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.searchRequestsService.remove(user.userId, id);
  }

  @Post(':id/match')
  @ApiOperation({
    summary: 'Run matching algorithm for a search request',
    description:
      'Finds listings that match the search criteria and calculates match scores. Results are saved to the matches table.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Matching completed',
    schema: {
      example: {
        matches: [
          {
            match: {
              id: '123e4567-e89b-12d3-a456-426614174002',
              searchRequestId: '123e4567-e89b-12d3-a456-426614174000',
              listingId: '123e4567-e89b-12d3-a456-426614174003',
              matchType: 'auto',
              score: 89,
              status: 'new',
            },
            listing: {
              id: '123e4567-e89b-12d3-a456-426614174003',
              title: '3+1 Deniz Manzaralı Daire',
              price: '2800000',
              city: 'İstanbul',
              district: 'Kadıköy',
              roomCount: '3+1',
              netSqm: 120,
            },
            scoreBreakdown: {
              location_match: 100,
              price_match: 85,
              size_match: 90,
              features_match: 70,
              room_match: 100,
              total: 89,
            },
          },
        ],
        totalFound: 5,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Search request not found' })
  async runMatching(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.matchingService.runMatching(user.userId, id);
  }
}
