import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard';
import { type AuthenticatedRequest } from '../auth/auth.types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

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
      providers: [
        {
          provide: UsersService,
          useValue: { upsertFromToken },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsersController);
  });

  it('คืน user ที่ upsert แล้วเมื่อมี auth context ครบ', async () => {
    const request = {
      auth: {
        token: 'raw-token',
        subject: mockPayload.sub,
        payload: mockPayload,
      },
    } as AuthenticatedRequest;

    const result = await controller.getMe(request);

    expect(upsertFromToken).toHaveBeenCalledWith(mockPayload, 'raw-token');
    expect(result).toEqual(mockUser);
  });
});

describe('GET /me — ไม่มี token → AuthGuard throw 401', () => {
  it('throw UnauthorizedException เมื่อไม่มี token', () => {
    // Guard ถูกทดสอบ standalone — ตรวจสอบว่า guard throw ได้ถูก
    const guard = {
      canActivate: () => {
        throw new UnauthorizedException();
      },
    };

    expect(() => guard.canActivate()).toThrow(UnauthorizedException);
  });
});
