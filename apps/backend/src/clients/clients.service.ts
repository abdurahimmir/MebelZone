import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateClientDto } from './dto/create-client.dto';
import type { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.client.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email?.toLowerCase(),
        comment: dto.comment,
        companyName: dto.companyName,
      },
    });
  }

  async getOne(userId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, userId },
    });
    if (!client) throw new NotFoundException();
    return client;
  }

  async update(userId: string, id: string, dto: UpdateClientDto) {
    await this.getOne(userId, id);
    return this.prisma.client.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email?.toLowerCase(),
        comment: dto.comment,
        companyName: dto.companyName,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.getOne(userId, id);
    await this.prisma.client.delete({ where: { id } });
    return { ok: true };
  }

  async projects(userId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, userId },
    });
    if (!client) throw new NotFoundException();

    return this.prisma.project.findMany({
      where: { userId, clientId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        totalCostCached: true,
      },
    });
  }

  async assertOwnsClient(userId: string, clientId: string | null | undefined) {
    if (!clientId) return;
    const c = await this.prisma.client.findFirst({
      where: { id: clientId, userId },
    });
    if (!c) throw new ForbiddenException('Invalid client for user');
  }
}
