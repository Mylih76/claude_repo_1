import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingFilterDto } from './dto/listing-filter.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Listing, Prisma } from '@prisma/client';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateListingDto): Promise<Listing> {
    return this.prisma.listing.create({
      data: {
        userId,
        listingType: dto.listingType,
        propertyType: dto.propertyType,
        status: dto.status || 'active',
        title: dto.title,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'TRY',
        grossSqm: dto.grossSqm,
        netSqm: dto.netSqm,
        roomCount: dto.roomCount,
        buildingAge: dto.buildingAge,
        floorNumber: dto.floorNumber,
        totalFloors: dto.totalFloors,
        isFurnished: dto.isFurnished,
        heatingType: dto.heatingType,
        viewType: dto.viewType,
        entranceType: dto.entranceType,
        isInComplex: dto.isInComplex,
        dues: dto.dues,
        city: dto.city,
        district: dto.district,
        neighborhood: dto.neighborhood,
        addressDetail: dto.addressDetail,
        latitude: dto.latitude,
        longitude: dto.longitude,
        features: dto.features || [],
      },
      include: {
        media: true,
      },
    });
  }

  async findAll(
    userId: string,
    filter: ListingFilterDto,
  ): Promise<PaginatedResponse<Listing>> {
    const where: Prisma.ListingWhereInput = {
      userId,
      deletedAt: null,
    };

    // Apply filters
    if (filter.listingType) {
      where.listingType = filter.listingType;
    }

    if (filter.propertyType) {
      where.propertyType = filter.propertyType;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }

    if (filter.district) {
      where.district = { contains: filter.district, mode: 'insensitive' };
    }

    if (filter.neighborhood) {
      where.neighborhood = { contains: filter.neighborhood, mode: 'insensitive' };
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) {
        where.price.gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        where.price.lte = filter.maxPrice;
      }
    }

    if (filter.minSqm !== undefined || filter.maxSqm !== undefined) {
      where.netSqm = {};
      if (filter.minSqm !== undefined) {
        where.netSqm.gte = filter.minSqm;
      }
      if (filter.maxSqm !== undefined) {
        where.netSqm.lte = filter.maxSqm;
      }
    }

    if (filter.roomCount) {
      where.roomCount = filter.roomCount;
    }

    if (filter.furnished !== undefined) {
      where.isFurnished = filter.furnished;
    }

    // Get total count
    const total = await this.prisma.listing.count({ where });

    // Get listings
    const listings = await this.prisma.listing.findMany({
      where,
      skip: filter.skip,
      take: filter.take,
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          where: { isCover: true },
          take: 1,
        },
      },
    });

    return {
      data: listings,
      meta: {
        total,
        page: filter.page || 1,
        limit: filter.limit || 20,
        totalPages: Math.ceil(total / (filter.limit || 20)),
      },
    };
  }

  // View all listings marketplace (all agents can see)
  async findAllMarketplace(
    filter: ListingFilterDto,
  ): Promise<PaginatedResponse<Listing>> {
    const where: Prisma.ListingWhereInput = {
      deletedAt: null,
      status: 'active', // Only show active listings in marketplace
    };

    // Apply filters (same as findAll but without userId filter)
    if (filter.listingType) {
      where.listingType = filter.listingType;
    }

    if (filter.propertyType) {
      where.propertyType = filter.propertyType;
    }

    if (filter.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }

    if (filter.district) {
      where.district = { contains: filter.district, mode: 'insensitive' };
    }

    if (filter.neighborhood) {
      where.neighborhood = { contains: filter.neighborhood, mode: 'insensitive' };
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) {
        where.price.gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        where.price.lte = filter.maxPrice;
      }
    }

    if (filter.minSqm !== undefined || filter.maxSqm !== undefined) {
      where.netSqm = {};
      if (filter.minSqm !== undefined) {
        where.netSqm.gte = filter.minSqm;
      }
      if (filter.maxSqm !== undefined) {
        where.netSqm.lte = filter.maxSqm;
      }
    }

    if (filter.roomCount) {
      where.roomCount = filter.roomCount;
    }

    if (filter.furnished !== undefined) {
      where.isFurnished = filter.furnished;
    }

    // Get total count
    const total = await this.prisma.listing.count({ where });

    // Get listings
    const listings = await this.prisma.listing.findMany({
      where,
      skip: filter.skip,
      take: filter.take,
      orderBy: { createdAt: 'desc' },
      include: {
        media: {
          where: { isCover: true },
          take: 1,
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return {
      data: listings,
      meta: {
        total,
        page: filter.page || 1,
        limit: filter.limit || 20,
        totalPages: Math.ceil(total / (filter.limit || 20)),
      },
    };
  }

  // View single listing (all agents can see)
  async findOnePublic(id: string): Promise<Listing> {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException({
        errorCode: 'LISTING_NOT_FOUND',
        message: 'Listing not found',
      });
    }

    return listing;
  }

  // Private method: Get listing with ownership check (for updates/deletes)
  async findOne(userId: string, id: string): Promise<Listing> {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        media: {
          orderBy: { sortOrder: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException({
        errorCode: 'LISTING_NOT_FOUND',
        message: 'Listing not found',
      });
    }

    // Check ownership for modifications
    if (listing.userId !== userId) {
      throw new ForbiddenException({
        errorCode: 'FORBIDDEN',
        message: 'You do not have access to this listing',
      });
    }

    return listing;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateListingDto,
  ): Promise<Listing> {
    // Check existence and ownership
    await this.findOne(userId, id);

    return this.prisma.listing.update({
      where: { id },
      data: {
        ...(dto.listingType && { listingType: dto.listingType }),
        ...(dto.propertyType && { propertyType: dto.propertyType }),
        ...(dto.status && { status: dto.status }),
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.grossSqm !== undefined && { grossSqm: dto.grossSqm }),
        ...(dto.netSqm !== undefined && { netSqm: dto.netSqm }),
        ...(dto.roomCount !== undefined && { roomCount: dto.roomCount }),
        ...(dto.buildingAge !== undefined && { buildingAge: dto.buildingAge }),
        ...(dto.floorNumber !== undefined && { floorNumber: dto.floorNumber }),
        ...(dto.totalFloors !== undefined && { totalFloors: dto.totalFloors }),
        ...(dto.isFurnished !== undefined && { isFurnished: dto.isFurnished }),
        ...(dto.heatingType !== undefined && { heatingType: dto.heatingType }),
        ...(dto.viewType !== undefined && { viewType: dto.viewType }),
        ...(dto.entranceType !== undefined && { entranceType: dto.entranceType }),
        ...(dto.isInComplex !== undefined && { isInComplex: dto.isInComplex }),
        ...(dto.dues !== undefined && { dues: dto.dues }),
        ...(dto.city && { city: dto.city }),
        ...(dto.district && { district: dto.district }),
        ...(dto.neighborhood !== undefined && { neighborhood: dto.neighborhood }),
        ...(dto.addressDetail !== undefined && { addressDetail: dto.addressDetail }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.features !== undefined && { features: dto.features }),
      },
      include: {
        media: true,
      },
    });
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    // Check existence and ownership
    await this.findOne(userId, id);

    // Soft delete
    await this.prisma.listing.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'inactive',
      },
    });

    return { message: 'Listing deleted successfully' };
  }

  // For matching service - get listings without user check
  async findAllForMatching(filter: {
    listingType?: string;
    propertyTypes?: string[]; // ✅ Added propertyTypes filter
    cities?: string[];
    districts?: string[];
    neighborhoods?: string[];
    minPrice?: number;
    maxPrice?: number;
    minSqm?: number;
    maxSqm?: number;
    roomCountMin?: string;
    roomCountMax?: string;
    mustHaveFeatures?: string[];
  }): Promise<Listing[]> {
    const where: Prisma.ListingWhereInput = {
      deletedAt: null,
      status: 'active',
    };

    if (filter.listingType) {
      where.listingType = filter.listingType as Prisma.EnumListingTypeFilter;
    }

    // ✅ Filter by property types (apartment, villa, etc.)
    if (filter.propertyTypes && filter.propertyTypes.length > 0) {
      where.propertyType = { in: filter.propertyTypes as any };
    }

    if (filter.cities && filter.cities.length > 0) {
      where.city = { in: filter.cities, mode: 'insensitive' };
    }

    if (filter.districts && filter.districts.length > 0) {
      where.district = { in: filter.districts, mode: 'insensitive' };
    }

    if (filter.neighborhoods && filter.neighborhoods.length > 0) {
      where.neighborhood = { in: filter.neighborhoods, mode: 'insensitive' };
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) {
        where.price.gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        where.price.lte = filter.maxPrice;
      }
    }

    if (filter.minSqm !== undefined || filter.maxSqm !== undefined) {
      where.netSqm = {};
      if (filter.minSqm !== undefined) {
        where.netSqm.gte = filter.minSqm;
      }
      if (filter.maxSqm !== undefined) {
        where.netSqm.lte = filter.maxSqm;
      }
    }

    return this.prisma.listing.findMany({
      where,
      include: {
        media: {
          where: { isCover: true },
          take: 1,
        },
      },
    });
  }
}
