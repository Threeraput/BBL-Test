import type { INestApplication } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { type AuthenticatedRequest } from '../auth/auth.types';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const supertest = require('supertest') as typeof import('supertest');

const OWNER_A = 'user-a';
const mockPayload = { iss: 'https://dev-yg.us.auth0.com/', sub: OWNER_A, aud: 'https://bbl-candidate-test-api' };

const mockBookmark = {
  id: 'bm-1',
  url: 'https://example.com',
  title: 'Example',
  notes: null,
  collectionId: 'col-1',
  ownerId: OWNER_A,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const emptyService = (): Partial<BookmarksService> => ({
  list: jest.fn(), getOne: jest.fn(), create: jest.fn(),
  replace: jest.fn(), patch: jest.fn(), remove: jest.fn(),
});

async function buildHttpApp(svc: Partial<BookmarksService> = emptyService()): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [BookmarksController],
    providers: [
      { provide: BookmarksService, useValue: svc },
      { provide: AuthService, useValue: { verifyAccessToken: jest.fn().mockRejectedValue(new Error()) } },
      AuthGuard,
    ],
  }).compile();
  const app = module.createNestApplication();
  await app.init();
  return app;
}

async function buildController(svc: Partial<BookmarksService> = emptyService()) {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [BookmarksController],
    providers: [{ provide: BookmarksService, useValue: svc }],
  })
    .overrideGuard(AuthGuard)
    .useValue({ canActivate: () => true })
    .compile();
  return module.get(BookmarksController);
}

const makeReq = (subject = OWNER_A): AuthenticatedRequest =>
  ({ auth: { token: 'tok', subject, payload: mockPayload } }) as AuthenticatedRequest;

// ─── Happy path ───────────────────────────────────────────────────────────────

describe('BookmarksController — happy path', () => {
  it('list without collectionId passes ownerId only', async () => {
    const list = jest.fn().mockResolvedValue([mockBookmark]);
    const ctrl = await buildController({ list });
    await ctrl.list(undefined, makeReq());
    expect(list).toHaveBeenCalledWith(OWNER_A, undefined);
  });

  it('list with collectionId passes both', async () => {
    const list = jest.fn().mockResolvedValue([mockBookmark]);
    const ctrl = await buildController({ list });
    await ctrl.list('col-1', makeReq());
    expect(list).toHaveBeenCalledWith(OWNER_A, 'col-1');
  });

  it('getOne passes id and ownerId', async () => {
    const getOne = jest.fn().mockResolvedValue(mockBookmark);
    const ctrl = await buildController({ getOne });
    await ctrl.getOne('bm-1', makeReq());
    expect(getOne).toHaveBeenCalledWith('bm-1', OWNER_A);
  });

  it('create passes ownerId from token', async () => {
    const create = jest.fn().mockResolvedValue(mockBookmark);
    const ctrl = await buildController({ create });
    await ctrl.create({ url: 'https://x.com', title: 'X' }, makeReq());
    expect(create).toHaveBeenCalledWith(OWNER_A, { url: 'https://x.com', title: 'X' });
  });

  it('replace passes id and ownerId', async () => {
    const replace = jest.fn().mockResolvedValue(mockBookmark);
    const ctrl = await buildController({ replace });
    await ctrl.replace('bm-1', { url: 'https://new.com', title: 'New' }, makeReq());
    expect(replace).toHaveBeenCalledWith('bm-1', OWNER_A, { url: 'https://new.com', title: 'New' });
  });

  it('patch passes id and ownerId', async () => {
    const patch = jest.fn().mockResolvedValue(mockBookmark);
    const ctrl = await buildController({ patch });
    await ctrl.patch('bm-1', { title: 'Patched' }, makeReq());
    expect(patch).toHaveBeenCalledWith('bm-1', OWNER_A, { title: 'Patched' });
  });

  it('remove passes id and ownerId', async () => {
    const remove = jest.fn().mockResolvedValue(undefined);
    const ctrl = await buildController({ remove });
    await ctrl.remove('bm-1', makeReq());
    expect(remove).toHaveBeenCalledWith('bm-1', OWNER_A);
  });
});

// ─── Adversarial ──────────────────────────────────────────────────────────────

describe('BookmarksController — adversarial (owner B uses owner A id)', () => {
  it('getOne returns 404 not 403 for another user bookmark', async () => {
    const getOne = jest.fn().mockRejectedValue(new NotFoundException());
    const ctrl = await buildController({ getOne });
    await expect(ctrl.getOne('bm-1', makeReq('user-b'))).rejects.toBeInstanceOf(NotFoundException);
    expect(getOne).toHaveBeenCalledWith('bm-1', 'user-b');
  });

  it('replace returns 404 for another user bookmark', async () => {
    const replace = jest.fn().mockRejectedValue(new NotFoundException());
    const ctrl = await buildController({ replace });
    await expect(ctrl.replace('bm-1', { url: 'https://hack.com', title: 'Hack' }, makeReq('user-b'))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('patch returns 404 for another user bookmark', async () => {
    const patch = jest.fn().mockRejectedValue(new NotFoundException());
    const ctrl = await buildController({ patch });
    await expect(ctrl.patch('bm-1', { title: 'Hack' }, makeReq('user-b'))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove returns 404 for another user bookmark', async () => {
    const remove = jest.fn().mockRejectedValue(new NotFoundException());
    const ctrl = await buildController({ remove });
    await expect(ctrl.remove('bm-1', makeReq('user-b'))).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ─── Unauthenticated (HTTP-level) ─────────────────────────────────────────────

describe('BookmarksController — unauthenticated → HTTP 401', () => {
  let app: INestApplication;

  beforeEach(async () => { app = await buildHttpApp(); });
  afterEach(async () => { await app.close(); });

  it('GET /bookmarks without token → 401', async () => {
    await supertest(app.getHttpServer()).get('/bookmarks').expect(401);
  });

  it('GET /bookmarks/:id without token → 401', async () => {
    await supertest(app.getHttpServer()).get('/bookmarks/bm-1').expect(401);
  });

  it('POST /bookmarks without token → 401', async () => {
    await supertest(app.getHttpServer()).post('/bookmarks').send({ url: 'https://x.com', title: 'x' }).expect(401);
  });

  it('PUT /bookmarks/:id without token → 401', async () => {
    await supertest(app.getHttpServer()).put('/bookmarks/bm-1').send({ url: 'https://x.com', title: 'x' }).expect(401);
  });

  it('PATCH /bookmarks/:id without token → 401', async () => {
    await supertest(app.getHttpServer()).patch('/bookmarks/bm-1').send({ title: 'x' }).expect(401);
  });

  it('DELETE /bookmarks/:id without token → 401', async () => {
    await supertest(app.getHttpServer()).delete('/bookmarks/bm-1').expect(401);
  });
});
