import { NotFoundException } from '@nestjs/common';
import { type PrismaService } from '../prisma.service';
import { CollectionsService } from './collections.service';

const OWNER_A = 'user-a';
const OWNER_B = 'user-b';
const COLLECTION_ID = 'col-1';

const mockCollection = {
  id: COLLECTION_ID,
  name: 'My List',
  ownerId: OWNER_A,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const makePrisma = (overrides: Partial<Record<string, jest.Mock>> = {}) => {
  const defaults = {
    findMany: jest.fn().mockResolvedValue([mockCollection]),
    findFirst: jest.fn().mockResolvedValue(mockCollection),
    create: jest.fn().mockResolvedValue(mockCollection),
    update: jest.fn().mockResolvedValue(mockCollection),
    delete: jest.fn().mockResolvedValue(mockCollection),
  };
  return {
    collection: { ...defaults, ...overrides },
  } as unknown as PrismaService;
};

describe('CollectionsService — happy path', () => {
  it('list returns collections filtered by ownerId', async () => {
    const prisma = makePrisma();
    const service = new CollectionsService(prisma);

    await service.list(OWNER_A);

    expect(prisma.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: OWNER_A } }),
    );
  });

  it('getOne returns collection when ownerId matches', async () => {
    const prisma = makePrisma();
    const service = new CollectionsService(prisma);

    const result = await service.getOne(COLLECTION_ID, OWNER_A);

    expect(prisma.collection.findFirst).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID, ownerId: OWNER_A },
    });
    expect(result).toEqual(mockCollection);
  });

  it('create sets ownerId from caller not body', async () => {
    const prisma = makePrisma();
    const service = new CollectionsService(prisma);

    await service.create(OWNER_A, { name: 'New' });

    expect(prisma.collection.create).toHaveBeenCalledWith({
      data: { name: 'New', ownerId: OWNER_A },
    });
  });

  it('replace calls getOne then update', async () => {
    const prisma = makePrisma();
    const service = new CollectionsService(prisma);

    await service.replace(COLLECTION_ID, OWNER_A, { name: 'Replaced' });

    expect(prisma.collection.findFirst).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID, ownerId: OWNER_A },
    });
    expect(prisma.collection.update).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID },
      data: { name: 'Replaced' },
    });
  });

  it('patch with name updates only name', async () => {
    const prisma = makePrisma();
    const service = new CollectionsService(prisma);

    await service.patch(COLLECTION_ID, OWNER_A, { name: 'Patched' });

    expect(prisma.collection.update).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID },
      data: { name: 'Patched' },
    });
  });

  it('patch with empty body does not mutate record', async () => {
    const prisma = makePrisma();
    const service = new CollectionsService(prisma);

    await service.patch(COLLECTION_ID, OWNER_A, {});

    expect(prisma.collection.update).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID },
      data: {},
    });
  });

  it('remove calls getOne then delete', async () => {
    const prisma = makePrisma();
    const service = new CollectionsService(prisma);

    await service.remove(COLLECTION_ID, OWNER_A);

    expect(prisma.collection.findFirst).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID, ownerId: OWNER_A },
    });
    expect(prisma.collection.delete).toHaveBeenCalledWith({
      where: { id: COLLECTION_ID },
    });
  });
});

describe('CollectionsService — adversarial (owner B tries to access owner A data)', () => {
  // findFirst returns null when ownerId does not match — simulates Prisma behaviour
  const prismaNotFound = makePrisma({ findFirst: jest.fn().mockResolvedValue(null) });

  it('getOne throws NotFoundException — not 403 — so existence is not revealed', async () => {
    const service = new CollectionsService(prismaNotFound);
    await expect(service.getOne(COLLECTION_ID, OWNER_B)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('replace throws 404 when ownerId does not match', async () => {
    const service = new CollectionsService(prismaNotFound);
    await expect(
      service.replace(COLLECTION_ID, OWNER_B, { name: 'Hack' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('patch throws 404 when ownerId does not match', async () => {
    const service = new CollectionsService(prismaNotFound);
    await expect(
      service.patch(COLLECTION_ID, OWNER_B, { name: 'Hack' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove throws 404 when ownerId does not match', async () => {
    const service = new CollectionsService(prismaNotFound);
    await expect(service.remove(COLLECTION_ID, OWNER_B)).rejects.toBeInstanceOf(NotFoundException);
  });
});
