import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { type VerifiedAccessTokenPayload } from '../auth/auth.service';
import { AuthService } from '../auth/auth.service';

type UserInfoResponse = {
  sub: string;
  email?: string;
  name?: string;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async upsertFromToken(
    payload: VerifiedAccessTokenPayload,
    rawAccessToken: string,
  ) {
    let email = payload.email as string | undefined;
    let name = payload.name as string | undefined;

    // Try to get email/name from token payload first
    if (!email || !name) {
      console.log(
        `[UsersService] email/name missing from token payload, falling back to /userinfo endpoint`,
      );

      const userInfo = await this.fetchUserInfoFromEndpoint(rawAccessToken);
      email = email || userInfo.email;
      name = name || userInfo.name;

      console.log(
        `[UsersService] fetched from /userinfo: email=${userInfo.email}, name=${userInfo.name}`,
      );
    } else {
      console.log(`[UsersService] email/name found in token payload directly`);
    }

    const user = await this.prisma.user.upsert({
      where: { id: payload.sub },
      update: {
        email: email || '',
        name: name || null,
      },
      create: {
        id: payload.sub,
        email: email || '',
        name: name || null,
      },
    });

    console.log(`[UsersService] upserted user: id=${user.id}, email=${user.email}`);

    return user;
  }

  private async fetchUserInfoFromEndpoint(
    rawAccessToken: string,
  ): Promise<UserInfoResponse> {
    const discovery = await this.authService.getDiscoveryDocument();
    const userInfoEndpoint = discovery.userinfo_endpoint;

    if (!userInfoEndpoint) {
      throw new UnauthorizedException(
        'Auth0 discovery document missing userinfo_endpoint',
      );
    }

    const response = await fetch(userInfoEndpoint, {
      headers: {
        Authorization: `Bearer ${rawAccessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException(
        `Failed to fetch userinfo: ${response.status}`,
      );
    }

    const body = (await response.json()) as Partial<UserInfoResponse>;

    return {
      sub: body.sub || '',
      email: body.email,
      name: body.name,
    };
  }
}
