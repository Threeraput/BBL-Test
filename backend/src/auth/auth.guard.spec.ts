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
});
