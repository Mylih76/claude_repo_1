import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { ActivityFilterDto } from './dto/activity-filter.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Activity, Prisma } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateActivityDto): Promise<Activity> {
    // Verify contact ownership if contactId provided
    if (dto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: dto.contactId, userId, deletedAt: null },
      });
      if (!contact) {
        throw new ForbiddenException({
          errorCode: 'FORBIDDEN',
          message: 'Contact not found or you do not have access',
        });
      }
    }

    // Verify listing ownership if listingId provided
    if (dto.listingId) {
      const listing = await this.prisma.listing.findFirst({
        where: { id: dto.listingId, userId, deletedAt: null },
      });
      if (!listing) {
        throw new ForbiddenException({
          errorCode: 'FORBIDDEN',
          message: 'Listing not found or you do not have access',
        });
      }
    }

    return this.prisma.activity.create({
      data: {
        userId,
        contactId: dto.contactId,
        listingId: dto.listingId,
        activityType: dto.activityType,
        title: dto.title,
        description: dto.description,
        outcome: dto.outcome,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        scheduledAt: dto.scheduledAt,
        completedAt: dto.completedAt,
      },
      include: {
        contact: {
          select: { id: true, name: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async findAll(
    userId: string,
    filter: ActivityFilterDto,
  ): Promise<PaginatedResponse<Activity>> {
    const where: Prisma.ActivityWhereInput = {
      userId,
    };

    if (filter.contactId) {
      where.contactId = filter.contactId;
    }

    if (filter.listingId) {
      where.listingId = filter.listingId;
    }

    if (filter.activityType) {
      where.activityType = filter.activityType;
    }

    const total = await this.prisma.activity.count({ where });

    const activities = await this.prisma.activity.findMany({
      where,
      skip: filter.skip,
      take: filter.take,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: { id: true, name: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    return {
      data: activities,
      meta: {
        total,
        page: filter.page || 1,
        limit: filter.limit || 20,
        totalPages: Math.ceil(total / (filter.limit || 20)),
      },
    };
  }
}
