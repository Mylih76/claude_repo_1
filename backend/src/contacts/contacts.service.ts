import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactFilterDto } from './dto/contact-filter.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { Contact, Prisma } from '@prisma/client';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateContactDto): Promise<Contact> {
    return this.prisma.contact.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        source: dto.source || 'manual',
        contactType: dto.contactType || 'buyer',
        status: dto.status || 'new',
        notes: dto.notes,
      },
    });
  }

  async findAll(
    userId: string,
    filter: ContactFilterDto,
  ): Promise<PaginatedResponse<Contact>> {
    const where: Prisma.ContactWhereInput = {
      userId,
      deletedAt: null,
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.contactType) {
      where.contactType = filter.contactType;
    }

    if (filter.source) {
      where.source = filter.source;
    }

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const total = await this.prisma.contact.count({ where });

    const contacts = await this.prisma.contact.findMany({
      where,
      skip: filter.skip,
      take: filter.take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            searchRequests: true,
            activities: true,
          },
        },
      },
    });

    return {
      data: contacts,
      meta: {
        total,
        page: filter.page || 1,
        limit: filter.limit || 20,
        totalPages: Math.ceil(total / (filter.limit || 20)),
      },
    };
  }

  async findOne(userId: string, id: string): Promise<Contact> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        searchRequests: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!contact) {
      throw new NotFoundException({
        errorCode: 'CONTACT_NOT_FOUND',
        message: 'Contact not found',
      });
    }

    if (contact.userId !== userId) {
      throw new ForbiddenException({
        errorCode: 'FORBIDDEN',
        message: 'You do not have access to this contact',
      });
    }

    return contact;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateContactDto,
  ): Promise<Contact> {
    await this.findOne(userId, id);

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.source && { source: dto.source }),
        ...(dto.contactType && { contactType: dto.contactType }),
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(userId: string, id: string): Promise<{ message: string }> {
    await this.findOne(userId, id);

    await this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Contact deleted successfully' };
  }
}
