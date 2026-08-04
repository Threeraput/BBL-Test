import { UnauthorizedException } from '@nestjs/common';
import { type AuthService, type VerifiedAccessTokenPayload } from '../auth/auth.service';
import { type PrismaService } from '../prisma.service';
import { UsersService } from './users.service';

const mockUser = {
  id: 'google-oauth2|123',
  email: 'user@example.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const discoveryDocument = {
  issuer: 'https://dev-yg.us.auth0.com/',
  jwks_uri: 'https://dev-yg.us.auth0.com/.well-known/jwks.json',
  userinfo_endpoint: 'https://dev-yg.us.auth0.com/userinfo',
};

const makePayload = (overrides: Partial<VerifiedAccessTokenPayload> = {}): VerifiedAccessTokenPayload => ({
  iss: discoveryDocument.issuer,
  sub: 'google-oauth2|123',
  aud: 'https://bbl-candidate-test-api',
  ...overrides,
});

describe('UsersService', () => {
  let service: UsersService;
  let upsert: jest.Mock;
  let getDiscoveryDocument: jest.Mock;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    upsert = jest.fn().mockResolvedValue(mockUser);
    getDiscoveryDocument = jest.fn().mockResolvedValue(discoveryDocument);

    const prisma = { user: { upsert } } as unknown as PrismaService;
    const authService = { getDiscoveryDocument } as unknown as AuthService;

    service = new UsersService(prisma, authService);

    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('payload มี email และ name', () => {
    it('upsert ด้วยข้อมูลจาก payload โดยตรง ไม่เรียก /userinfo', async () => {
      const payload = makePayload({ email: 'user@example.com', name: 'Test User' });

      await service.upsertFromToken(payload, 'raw-token');

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(upsert).toHaveBeenCalledWith({
        where: { id: 'google-oauth2|123' },
        update: { email: 'user@example.com', name: 'Test User' },
        create: { id: 'google-oauth2|123', email: 'user@example.com', name: 'Test User' },
      });
    });
  });

  describe('payload ไม่มี email', () => {
    it('เรียก /userinfo แล้ว upsert ด้วยผลจาก userinfo', async () => {
      const payload = makePayload(); // ไม่มี email, name

      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'google-oauth2|123',
          email: 'from-userinfo@example.com',
          name: 'From UserInfo',
        }),
      } as Response);

      await service.upsertFromToken(payload, 'raw-token');

      expect(fetchSpy).toHaveBeenCalledWith(
        discoveryDocument.userinfo_endpoint,
        expect.objectContaining({
          headers: { Authorization: 'Bearer raw-token' },
        }),
      );
      expect(upsert).toHaveBeenCalledWith({
        where: { id: 'google-oauth2|123' },
        update: { email: 'from-userinfo@example.com', name: 'From UserInfo' },
        create: { id: 'google-oauth2|123', email: 'from-userinfo@example.com', name: 'From UserInfo' },
      });
    });

    it('throw UnauthorizedException ถ้า /userinfo response ไม่ ok', async () => {
      const payload = makePayload();

      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      await expect(service.upsertFromToken(payload, 'bad-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throw UnauthorizedException ถ้า discovery ไม่มี userinfo_endpoint', async () => {
      const payload = makePayload();

      getDiscoveryDocument.mockResolvedValueOnce({
        issuer: discoveryDocument.issuer,
        jwks_uri: discoveryDocument.jwks_uri,
        // userinfo_endpoint หายไป
      });

      await expect(service.upsertFromToken(payload, 'raw-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('upsert ซ้ำด้วย sub เดิม', () => {
    it('เรียก prisma.upsert ครั้งที่ 2 ด้วย sub เดิม ต้อง update ไม่สร้างใหม่', async () => {
      const payload = makePayload({ email: 'user@example.com', name: 'Test User' });

      await service.upsertFromToken(payload, 'raw-token');
      await service.upsertFromToken(payload, 'raw-token');

      // upsert ถูกเรียก 2 ครั้งด้วย where: { id: sub เดิม }
      expect(upsert).toHaveBeenCalledTimes(2);
      expect(upsert.mock.calls[0][0].where).toEqual({ id: 'google-oauth2|123' });
      expect(upsert.mock.calls[1][0].where).toEqual({ id: 'google-oauth2|123' });
    });
  });
});
