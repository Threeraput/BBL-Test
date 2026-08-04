import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { PatchBookmarkDto, UpdateBookmarkDto } from './dto/update-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: string, collectionId?: string) {
    return this.prisma.bookmark.findMany({
      where: {
        ownerId,
        ...(collectionId !== undefined && { collectionId }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string, ownerId: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, ownerId },
    });
    if (!bookmark) throw new NotFoundException();
    return bookmark;
  }

  create(ownerId: string, dto: CreateBookmarkDto) {
    return this.prisma.bookmark.create({
      data: {
        url: dto.url,
        title: dto.title,
        notes: dto.notes,
        collectionId: dto.collectionId ?? null,
        ownerId,
      },
    });
  }

  async replace(id: string, ownerId: string, dto: UpdateBookmarkDto) {
    await this.getOne(id, ownerId);
    return this.prisma.bookmark.update({
      where: { id },
      data: {
        url: dto.url,
        title: dto.title,
        notes: dto.notes ?? null,
        collectionId: dto.collectionId ?? null,
      },
    });
  }

  async patch(id: string, ownerId: string, dto: PatchBookmarkDto) {
    await this.getOne(id, ownerId);
    return this.prisma.bookmark.update({
      where: { id },
      data: {
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.collectionId !== undefined && { collectionId: dto.collectionId }),
      },
    });
  }

  async remove(id: string, ownerId: string) {
    await this.getOne(id, ownerId);
    await this.prisma.bookmark.delete({ where: { id } });
  }
}
