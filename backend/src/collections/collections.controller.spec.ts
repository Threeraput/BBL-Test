import type { INestApplication } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { type AuthenticatedRequest } from '../auth/auth.types';
import { BookmarksService } from '../bookmarks/bookmarks.service';
import { CollectionsController } from './collections.controller';
import { CollectionsService } from './collections.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const supertest = require('supertest') as typeof import('supertest');

const OWNER_A = 'user-a';

const mockCollection = {
  id: 'col-1',
  name: 'My List',
  ownerId: OWNER_A,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPayload = { iss: 'https://dev-yg.us.auth0.com/', sub: OWNER_A, aud: 'https://bbl-candidate-test-api' };

// Build app with real AuthGuard but stubbed AuthService — for unauthenticated tests
const emptyBookmarksSvc = (): Partial<BookmarksService> => ({ list: jest.fn() });

async function buildHttpApp(serviceOverrides: Partial<CollectionsService> = {}): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [CollectionsController],
    providers: [
      { provide: CollectionsService, useValue: { list: jest.fn(), getOne: jest.fn(), create: jest.fn(), replace: jest.fn(), patch: jest.fn(), remove: jest.fn(), ...serviceOverrides } },
      { provide: BookmarksService, useValue: emptyBookmarksSvc() },
      { provide: AuthService, useValue: { verifyAccessToken: jest.fn().mockRejectedValue(new Error('no token')) } },
      AuthGuard,
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();
  return app;
}

// Build controller directly (guard bypassed) — for happy-path unit tests
async function buildControllerModule(
  serviceOverrides: Partial<CollectionsService> = {},
  bookmarksOverrides: Partial<BookmarksService> = {},
) {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [CollectionsController],
    providers: [
      { provide: CollectionsService, useValue: { list: jest.fn(), getOne: jest.fn(), create: jest.fn(), replace: jest.fn(), patch: jest.fn(), remove: jest.fn(), ...serviceOverrides } },
      { provide: BookmarksService, useValue: { ...emptyBookmarksSvc(), ...bookmarksOverrides } },
    ],
  })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

  return module.get(CollectionsController);
}

const makeRequest = (subject = OWNER_A): AuthenticatedRequest =>
  ({ auth: { token: 'tok', subject, payload: mockPayload } }) as AuthenticatedRequest;

// ─── Happy path ───────────────────────────────────────────────────────────────

describe('CollectionsController — happy path', () => {
  it('list calls service with ownerId', async () => {
    const list = jest.fn().mockResolvedValue([mockCollection]);
    const ctrl = await buildControllerModule({ list });
    await ctrl.list(makeRequest());
    expect(list).toHaveBeenCalledWith(OWNER_A);
  });

  it('getOne calls service with id and ownerId', async () => {
    const getOne = jest.fn().mockResolvedValue(mockCollection);
    const ctrl = await buildControllerModule({ getOne });
    await ctrl.getOne('col-1', makeRequest());
    expect(getOne).toHaveBeenCalledWith('col-1', OWNER_A);
  });

  it('create passes ownerId from token not body', async () => {
    const create = jest.fn().mockResolvedValue(mockCollection);
    const ctrl = await buildControllerModule({ create });
    await ctrl.create({ name: 'New' }, makeRequest());
    expect(create).toHaveBeenCalledWith(OWNER_A, { name: 'New' });
  });

  it('replace passes id and ownerId', async () => {
    const replace = jest.fn().mockResolvedValue(mockCollection);
    const ctrl = await buildControllerModule({ replace });
    await ctrl.replace('col-1', { name: 'Updated' }, makeRequest());
    expect(replace).toHaveBeenCalledWith('col-1', OWNER_A, { name: 'Updated' });
  });

  it('patch passes id and ownerId', async () => {
    const patch = jest.fn().mockResolvedValue(mockCollection);
    const ctrl = await buildControllerModule({ patch });
    await ctrl.patch('col-1', { name: 'Patched' }, makeRequest());
    expect(patch).toHaveBeenCalledWith('col-1', OWNER_A, { name: 'Patched' });
  });

  it('remove passes id and ownerId', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const ctrl = await buildControllerModule({ remove });
    await ctrl.remove('col-1', makeRequest());
    expect(remove).toHaveBeenCalledWith('col-1', OWNER_A);
  });

  it('listBookmarks verifies collection ownership then lists bookmarks filtered by collectionId', async () => {
    const getOne = jest.fn().mockResolvedValue(mockCollection);
    const list = jest.fn().mockResolvedValue([]);
    const ctrl = await buildControllerModule({ getOne }, { list });
    await ctrl.listBookmarks('col-1', makeRequest());
    expect(getOne).toHaveBeenCalledWith('col-1', OWNER_A);
    expect(list).toHaveBeenCalledWith(OWNER_A, 'col-1');
  });

  it('listBookmarks returns 404 when collection belongs to another user', async () => {
    const getOne = jest.fn().mockRejectedValue(new NotFoundException());
    const ctrl = await buildControllerModule({ getOne });
    await expect(ctrl.listBookmarks('col-1', makeRequest('user-b'))).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── Adversarial ──────────────────────────────────────────────────────────────

describe('CollectionsController — adversarial (owner B uses owner A id)', () => {
  it('getOne returns 404 not 403 when record belongs to another user', async () => {
    const getOne = jest.fn().mockRejectedValue(new NotFoundException());
    const ctrl = await buildControllerModule({ getOne });
    await expect(ctrl.getOne('col-1', makeRequest('user-b'))).rejects.toBeInstanceOf(NotFoundException);
    expect(getOne).toHaveBeenCalledWith('col-1', 'user-b');
  });

  it('replace returns 404 for another user collection', async () => {
    const replace = jest.fn().mockRejectedValue(new NotFoundException());
    const ctrl = await buildControllerModule({ replace });
    await expect(ctrl.replace('col-1', { name: 'Hack' }, makeRequest('user-b'))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('patch returns 404 for another user collection', async () => {
    const patch = jest.fn().mockRejectedValue(new NotFoundException());
    const ctrl = await buildControllerModule({ patch });
    await expect(ctrl.patch('col-1', { name: 'Hack' }, makeRequest('user-b'))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove returns 404 for another user collection', async () => {
    const remove = jest.fn().mockRejectedValue(new NotFoundException());
    const ctrl = await buildControllerModule({ remove });
    await expect(ctrl.remove('col-1', makeRequest('user-b'))).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── Unauthenticated (HTTP-level) ─────────────────────────────────────────────

describe('CollectionsController — unauthenticated → HTTP 401', () => {
  let app: INestApplication;

  beforeEach(async () => { app = await buildHttpApp(); });
  afterEach(async () => { await app.close(); });

  it('GET /collections without token → 401', async () => {
    await supertest(app.getHttpServer()).get('/collections').expect(401);
  });

  it('GET /collections/:id without token → 401', async () => {
    await supertest(app.getHttpServer()).get('/collections/col-1').expect(401);
  });

  it('POST /collections without token → 401', async () => {
    await supertest(app.getHttpServer()).post('/collections').send({ name: 'x' }).expect(401);
  });

  it('PUT /collections/:id without token → 401', async () => {
    await supertest(app.getHttpServer()).put('/collections/col-1').send({ name: 'x' }).expect(401);
  });

  it('PATCH /collections/:id without token → 401', async () => {
    await supertest(app.getHttpServer()).patch('/collections/col-1').send({ name: 'x' }).expect(401);
  });

  it('DELETE /collections/:id without token → 401', async () => {
    await supertest(app.getHttpServer()).delete('/collections/col-1').expect(401);
  });
});
