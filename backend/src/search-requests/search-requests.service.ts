import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSearchRequestDto } from './dto/create-search-request.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { SearchRequest, Prisma } from '@prisma/client';
import { SearchRequestFilterDto } from './dto/search-request-filter.dto';

@Injectable()
export class SearchRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateSearchRequestDto,
  ): Promise<SearchRequest> {
    return this.prisma.searchRequest.create({
      data: {
        userId,
        contactId: dto.contactId,
        source: dto.source || 'manual',
        status: dto.status || 'active',
        rawText: dto.rawText,
        listingType: dto.listingType,
        propertyTypes: dto.propertyTypes || [],
        budgetMin: dto.budgetMin,
        budgetMax: dto.budgetMax,
        currency: dto.currency || 'TRY',
        sqmMin: dto.sqmMin,
        sqmMax: dto.sqmMax,
        roomCountMin: dto.roomCountMin,
        roomCountMax: dto.roomCountMax,
        cities: dto.cities || [],
        districts: dto.districts || [],
        neighborhoods: dto.neighborhoods || [],
        mustHaveFeatures: dto.mustHaveFeatures || [],
        niceToHaveFeatures: dto.niceToHaveFeatures || [],
        criteria: dto.criteria || {},
        notes: dto.notes,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(
    userId: string,
    filter: SearchRequestFilterDto,
  ): Promise<PaginatedResponse<SearchRequest>> {
    const where: Prisma.SearchRequestWhereInput = {
      userId,
      deletedAt: null,
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.listingType) {
      where.listingType = filter.listingType;
    }

    if (filter.contactId) {
      where.contactId = filter.contactId;
    }

    const total = await this.prisma.searchRequest.count({ where });

    const requests = await this.prisma.searchRequest.findMany({
      where,
      skip: filter.skip,
      take: filter.take,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        _count: {
          select: { matches: true },
        },
      },
    });

    return {
      data: requests,
      meta: {
        total,
        page: filter.page || 1,
        limit: filter.limit || 20,
        totalPages: Math.ceil(total / (filter.limit || 20)),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<SearchRequest> {
    const request = await this.prisma.searchRequest.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        matches: {
          orderBy: { score: 'desc' },
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                price: true,
                city: true,
                district: true,
                roomCount: true,
                netSqm: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException({
        errorCode: 'SEARCH_REQUEST_NOT_FOUND',
        message: 'Search request not found',
      });
    }

    if (request.userId !== userId) {
      throw new ForbiddenException({
        errorCode: 'FORBIDDEN',
        message: 'You do not have access to this search request',
      });
    }

    return request;
  }

  async getSearchRequestForMatching(id: string): Promise<SearchRequest | null> {
    return this.prisma.searchRequest.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }
}
