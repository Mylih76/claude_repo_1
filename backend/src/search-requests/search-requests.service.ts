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
        criteria: (dto.criteria ?? {}) as Prisma.InputJsonValue,
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

  async update(
    userId: string,
    id: string,
    dto: Partial<CreateSearchRequestDto>,
  ): Promise<SearchRequest> {
    // Check ownership
    await this.findOne(userId, id);

    const updateData: any = {};

    if (dto.contactId !== undefined) updateData.contactId = dto.contactId;
    if (dto.source) updateData.source = dto.source;
    if (dto.status) updateData.status = dto.status;
    if (dto.rawText !== undefined) updateData.rawText = dto.rawText;
    if (dto.listingType !== undefined) updateData.listingType = dto.listingType;
    if (dto.propertyTypes !== undefined) updateData.propertyTypes = dto.propertyTypes;
    if (dto.budgetMin !== undefined) updateData.budgetMin = dto.budgetMin;
    if (dto.budgetMax !== undefined) updateData.budgetMax = dto.budgetMax;
    if (dto.currency) updateData.currency = dto.currency;
    if (dto.sqmMin !== undefined) updateData.sqmMin = dto.sqmMin;
    if (dto.sqmMax !== undefined) updateData.sqmMax = dto.sqmMax;
    if (dto.roomCountMin !== undefined) updateData.roomCountMin = dto.roomCountMin;
    if (dto.roomCountMax !== undefined) updateData.roomCountMax = dto.roomCountMax;
    if (dto.cities !== undefined) updateData.cities = dto.cities;
    if (dto.districts !== undefined) updateData.districts = dto.districts;
    if (dto.neighborhoods !== undefined) updateData.neighborhoods = dto.neighborhoods;
    if (dto.mustHaveFeatures !== undefined) updateData.mustHaveFeatures = dto.mustHaveFeatures;
    if (dto.niceToHaveFeatures !== undefined) updateData.niceToHaveFeatures = dto.niceToHaveFeatures;
    if (dto.criteria !== undefined) updateData.criteria = dto.criteria as Prisma.InputJsonValue;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return this.prisma.searchRequest.update({
      where: { id },
      data: updateData,
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

  async updateStatus(
    userId: string,
    id: string,
    status: string,
  ): Promise<SearchRequest> {
    // Check ownership
    await this.findOne(userId, id);

    return this.prisma.searchRequest.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    // Check ownership
    await this.findOne(userId, id);

    // Soft delete
    await this.prisma.searchRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Search request deleted successfully' };
  }
}
