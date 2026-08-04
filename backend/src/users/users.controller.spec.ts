import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { type AuthenticatedRequest } from '../auth/auth.types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// supertest ESM default export
// eslint-disable-next-line @typescript-eslint/no-require-imports
const supertest = require('supertest') as typeof import('supertest');

const mockUser = {
  id: 'google-oauth2|123',
  email: 'user@example.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPayload = {
  iss: 'https://dev-yg.us.auth0.com/',
  sub: 'google-oauth2|123',
  aud: 'https://bbl-candidate-test-api',
};

describe('UsersController GET /me', () => {
  let controller: UsersController;
  let upsertFromToken: jest.Mock;

  beforeEach(async () => {
    upsertFromToken = jest.fn().mockResolvedValue(mockUser);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: { upsertFromToken } }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsersController);
  });

  it('คืน user ที่ upsert แล้วเมื่อมี auth context ครบ', async () => {
    const request = {
      auth: { token: 'raw-token', subject: mockPayload.sub, payload: mockPayload },
    } as AuthenticatedRequest;

    const result = await controller.getMe(request);

    expect(upsertFromToken).toHaveBeenCalledWith(mockPayload, 'raw-token');
    expect(result).toEqual(mockUser);
  });
});

describe('GET /users/me — unauthenticated → HTTP 401', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { upsertFromToken: jest.fn() } },
        // AuthService stub — guard ใช้จริง (ไม่ override) เพื่อตรวจ HTTP 401
        {
          provide: AuthService,
          useValue: { verifyAccessToken: jest.fn().mockRejectedValue(new UnauthorizedException()) },
        },
        AuthGuard,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('ไม่มี Authorization header → HTTP 401', async () => {
    await supertest(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('Authorization scheme ไม่ใช่ Bearer → HTTP 401', async () => {
    await supertest(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Basic some-token')
      .expect(401);
  });
});
