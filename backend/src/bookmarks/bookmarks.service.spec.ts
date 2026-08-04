import { NotFoundException } from '@nestjs/common';
import { type PrismaService } from '../prisma.service';
import { BookmarksService } from './bookmarks.service';

const OWNER_A = 'user-a';
const OWNER_B = 'user-b';
const BM_ID = 'bm-1';
const COL_ID = 'col-1';

const mockBookmark = {
  id: BM_ID,
  url: 'https://example.com',
  title: 'Example',
  notes: null,
  collectionId: COL_ID,
  ownerId: OWNER_A,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makePrisma = (overrides: Partial<Record<string, jest.Mock>> = {}) => {
  const defaults = {
    findMany: jest.fn().mockResolvedValue([mockBookmark]),
    findFirst: jest.fn().mockResolvedValue(mockBookmark),
    create: jest.fn().mockResolvedValue(mockBookmark),
    update: jest.fn().mockResolvedValue(mockBookmark),
    delete: jest.fn().mockResolvedValue(mockBookmark),
  };
  return {
    bookmark: { ...defaults, ...overrides },
  } as unknown as PrismaService;
};

describe('BookmarksService — happy path', () => {
  it('list filters by ownerId only when no collectionId', async () => {
    const prisma = makePrisma();
    const service = new BookmarksService(prisma);
    await service.list(OWNER_A);
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: OWNER_A } }),
    );
  });

  it('list filters by ownerId AND collectionId when collectionId provided', async () => {
    const prisma = makePrisma();
    const service = new BookmarksService(prisma);
    await service.list(OWNER_A, COL_ID);
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: OWNER_A, collectionId: COL_ID } }),
    );
  });

  it('getOne queries with id and ownerId', async () => {
    const prisma = makePrisma();
    const service = new BookmarksService(prisma);
    await service.getOne(BM_ID, OWNER_A);
    expect(prisma.bookmark.findFirst).toHaveBeenCalledWith({
      where: { id: BM_ID, ownerId: OWNER_A },
    });
  });

  it('create sets ownerId from caller not body', async () => {
    const prisma = makePrisma();
    const service = new BookmarksService(prisma);
    await service.create(OWNER_A, { url: 'https://x.com', title: 'X' });
    expect(prisma.bookmark.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ownerId: OWNER_A }) }),
    );
  });

  it('replace calls getOne then update', async () => {
    const prisma = makePrisma();
    const service = new BookmarksService(prisma);
    await service.replace(BM_ID, OWNER_A, { url: 'https://new.com', title: 'New' });
    expect(prisma.bookmark.findFirst).toHaveBeenCalledWith({ where: { id: BM_ID, ownerId: OWNER_A } });
    expect(prisma.bookmark.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: BM_ID } }),
    );
  });

  it('patch with partial fields only updates those fields', async () => {
    const prisma = makePrisma();
    const service = new BookmarksService(prisma);
    await service.patch(BM_ID, OWNER_A, { title: 'Patched' });
    expect(prisma.bookmark.update).toHaveBeenCalledWith({
      where: { id: BM_ID },
      data: { title: 'Patched' },
    });
  });

  it('patch with empty body sends empty data', async () => {
    const prisma = makePrisma();
    const service = new BookmarksService(prisma);
    await service.patch(BM_ID, OWNER_A, {});
    expect(prisma.bookmark.update).toHaveBeenCalledWith({ where: { id: BM_ID }, data: {} });
  });

  it('remove calls getOne then delete', async () => {
    const prisma = makePrisma();
    const service = new BookmarksService(prisma);
    await service.remove(BM_ID, OWNER_A);
    expect(prisma.bookmark.findFirst).toHaveBeenCalledWith({ where: { id: BM_ID, ownerId: OWNER_A } });
    expect(prisma.bookmark.delete).toHaveBeenCalledWith({ where: { id: BM_ID } });
  });
});

describe('BookmarksService — adversarial (owner B tries to access owner A data)', () => {
  const prismaNotFound = makePrisma({ findFirst: jest.fn().mockResolvedValue(null) });

  it('getOne throws NotFoundException — not 403 — so existence is not revealed', async () => {
    const service = new BookmarksService(prismaNotFound);
    await expect(service.getOne(BM_ID, OWNER_B)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('replace throws 404 when ownerId does not match', async () => {
    const service = new BookmarksService(prismaNotFound);
    await expect(
      service.replace(BM_ID, OWNER_B, { url: 'https://hack.com', title: 'Hack' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('patch throws 404 when ownerId does not match', async () => {
    const service = new BookmarksService(prismaNotFound);
    await expect(service.patch(BM_ID, OWNER_B, { title: 'Hack' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove throws 404 when ownerId does not match', async () => {
    const service = new BookmarksService(prismaNotFound);
    await expect(service.remove(BM_ID, OWNER_B)).rejects.toBeInstanceOf(NotFoundException);
  });
});
