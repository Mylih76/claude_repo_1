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

  async update(
    userId: string,
    id: string,
    dto: Partial<CreateSearchRequestDto>,
  ): Promise<SearchRequest> {
    // Check ownership
    await this.findOne(userId, id);

    return this.prisma.searchRequest.update({
      where: { id },
      data: {
        ...(dto.contactId !== undefined && { contactId: dto.contactId }),
        ...(dto.source && { source: dto.source }),
        ...(dto.status && { status: dto.status }),
        ...(dto.rawText !== undefined && { rawText: dto.rawText }),
        ...(dto.listingType !== undefined && { listingType: dto.listingType }),
        ...(dto.propertyTypes !== undefined && { propertyTypes: dto.propertyTypes }),
        ...(dto.budgetMin !== undefined && { budgetMin: dto.budgetMin }),
        ...(dto.budgetMax !== undefined && { budgetMax: dto.budgetMax }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.sqmMin !== undefined && { sqmMin: dto.sqmMin }),
        ...(dto.sqmMax !== undefined && { sqmMax: dto.sqmMax }),
        ...(dto.roomCountMin !== undefined && { roomCountMin: dto.roomCountMin }),
        ...(dto.roomCountMax !== undefined && { roomCountMax: dto.roomCountMax }),
        ...(dto.cities !== undefined && { cities: dto.cities }),
        ...(dto.districts !== undefined && { districts: dto.districts }),
        ...(dto.neighborhoods !== undefined && { neighborhoods: dto.neighborhoods }),
        ...(dto.mustHaveFeatures !== undefined && { mustHaveFeatures: dto.mustHaveFeatures }),
        ...(dto.niceToHaveFeatures !== undefined && { niceToHaveFeatures: dto.niceToHaveFeatures }),
        ...(dto.criteria !== undefined && { criteria: dto.criteria }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
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
