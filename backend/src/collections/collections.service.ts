import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { PatchCollectionDto, UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string) {
    return this.prisma.collection.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string, ownerId: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, ownerId },
    });
    if (!collection) throw new NotFoundException();
    return collection;
  }

  create(ownerId: string, dto: CreateCollectionDto) {
    return this.prisma.collection.create({
      data: { name: dto.name, ownerId },
    });
  }

  async replace(id: string, ownerId: string, dto: UpdateCollectionDto) {
    await this.getOne(id, ownerId);
    return this.prisma.collection.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async patch(id: string, ownerId: string, dto: PatchCollectionDto) {
    await this.getOne(id, ownerId);
    return this.prisma.collection.update({
      where: { id },
      data: { ...(dto.name !== undefined && { name: dto.name }) },
    });
  }

  async remove(id: string, ownerId: string) {
    await this.getOne(id, ownerId);
    await this.prisma.collection.delete({ where: { id } });
  }
}
