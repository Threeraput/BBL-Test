import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { type AuthService } from './auth.service';
import { type AuthenticatedRequest } from './auth.types';

const createExecutionContext = (
  request: Partial<AuthenticatedRequest>,
): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as unknown as ExecutionContext;

describe('AuthGuard', () => {
  const verifyAccessToken = jest.fn();
  const authService = {
    verifyAccessToken,
  } as unknown as AuthService;

  let guard: AuthGuard;

  beforeEach(() => {
    verifyAccessToken.mockReset();
    guard = new AuthGuard(authService);
  });

  it('should throw UnauthorizedException when Authorization header is missing', async () => {
    const context = createExecutionContext({
      headers: {},
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when Authorization scheme is not Bearer', async () => {
    const context = createExecutionContext({
      headers: {
        authorization: 'Basic abc123',
      },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should attach auth to request and return true for a valid Bearer token', async () => {
    const payload = { iss: 'https://dev-yg.us.auth0.com/', sub: 'user-1', aud: 'https://bbl-candidate-test-api' };
    verifyAccessToken.mockResolvedValueOnce({ payload, protectedHeader: { alg: 'RS256' } });

    const request: Partial<AuthenticatedRequest> = { headers: { authorization: 'Bearer valid-token' } };
    const context = createExecutionContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.auth).toEqual({ token: 'valid-token', subject: 'user-1', payload });
    expect(verifyAccessToken).toHaveBeenCalledWith('valid-token');
  });
});
