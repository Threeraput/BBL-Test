import { UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyResult } from 'jose';
import { AUTH0_API_AUDIENCE } from './auth.constants';
import { AuthService, type VerifiedAccessTokenPayload } from './auth.service';

jest.mock('jose');

const mockedCreateRemoteJwkSet = jest.mocked(createRemoteJWKSet);
const mockedJwtVerify = jest.mocked(jwtVerify);

type DiscoveryDocument = {
  issuer: string;
  jwks_uri: string;
};

const discoveryDocument: DiscoveryDocument = {
  issuer: 'https://dev-yg.us.auth0.com/',
  jwks_uri: 'https://example.test/.well-known/jwks.json',
};

const createDiscoveryResponse = (body: DiscoveryDocument): Response =>
  ({
    ok: true,
    json: () => Promise.resolve(body),
  }) as Response;

const verifiedPayload: JWTVerifyResult<VerifiedAccessTokenPayload> = {
  payload: {
    iss: discoveryDocument.issuer,
    sub: 'auth0|user-123',
    aud: AUTH0_API_AUDIENCE,
  },
  protectedHeader: {
    alg: 'RS256',
    kid: 'kid-1',
  },
};

describe('AuthService (unit tests with mocks)', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();

    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(createDiscoveryResponse(discoveryDocument));

    mockedCreateRemoteJwkSet.mockReset();
    mockedJwtVerify.mockReset();

    mockedCreateRemoteJwkSet.mockReturnValue(
      jest.fn() as unknown as ReturnType<typeof createRemoteJWKSet>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw UnauthorizedException when the token signature is invalid', async () => {
    mockedJwtVerify.mockRejectedValueOnce(
      new Error('signature verification failed'),
    );

    await expect(
      service.verifyAccessToken('bad-signature-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockedCreateRemoteJwkSet).toHaveBeenCalledWith(
      new URL(discoveryDocument.jwks_uri),
    );
    expect(mockedJwtVerify).toHaveBeenCalledWith(
      'bad-signature-token',
      expect.any(Function),
      {
        issuer: discoveryDocument.issuer,
        audience: AUTH0_API_AUDIENCE,
      },
    );
  });

  it('should throw UnauthorizedException when aud does not match the API audience, proving an id_token cannot be used as a Bearer token', async () => {
    mockedJwtVerify.mockRejectedValueOnce(
      new Error('unexpected "aud" claim value'),
    );

    await expect(
      service.verifyAccessToken('simulated-id-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockedJwtVerify).toHaveBeenCalledWith(
      'simulated-id-token',
      expect.any(Function),
      {
        issuer: discoveryDocument.issuer,
        audience: AUTH0_API_AUDIENCE,
      },
    );
  });

  it('should throw UnauthorizedException when the token is expired', async () => {
    mockedJwtVerify.mockRejectedValueOnce(new Error('token expired'));

    await expect(
      service.verifyAccessToken('expired-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should return the verified payload when the token is valid', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedJwtVerify.mockResolvedValueOnce(verifiedPayload as any);

    const result = await service.verifyAccessToken('valid-token');

    expect(result).toEqual(verifiedPayload);
  });
});
