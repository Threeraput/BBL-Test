import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyResult,
} from 'jose';
import { AUTH0_API_AUDIENCE, AUTH0_DISCOVERY_URL } from './auth.constants';

type Auth0DiscoveryDocument = {
  issuer: string;
  jwks_uri: string;
};

export type VerifiedAccessTokenPayload = JWTPayload & {
  iss: string;
  sub: string;
  aud: string | string[];
  scope?: string;
  permissions?: string[];
};

@Injectable()
export class AuthService {
  private discoveryDocumentPromise?: Promise<Auth0DiscoveryDocument>;
  private jwksPromise?: Promise<ReturnType<typeof createRemoteJWKSet>>;

  async verifyAccessToken(
    token: string,
  ): Promise<JWTVerifyResult<VerifiedAccessTokenPayload>> {
    const discoveryDocument = await this.getDiscoveryDocument();
    const jwks = await this.getJwks();

    try {
      return await jwtVerify<VerifiedAccessTokenPayload>(token, jwks, {
        issuer: discoveryDocument.issuer,
        audience: AUTH0_API_AUDIENCE,
      });
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private async getDiscoveryDocument(): Promise<Auth0DiscoveryDocument> {
    if (!this.discoveryDocumentPromise) {
      this.discoveryDocumentPromise = this.fetchDiscoveryDocument();
    }

    return this.discoveryDocumentPromise;
  }

  private async getJwks(): Promise<ReturnType<typeof createRemoteJWKSet>> {
    if (!this.jwksPromise) {
      this.jwksPromise = this.getDiscoveryDocument().then(({ jwks_uri }) => {
        return createRemoteJWKSet(new URL(jwks_uri));
      });
    }

    return this.jwksPromise;
  }

  async fetchDiscoveryDocument(): Promise<Auth0DiscoveryDocument> {
    const response = await fetch(AUTH0_DISCOVERY_URL);

    if (!response.ok) {
      throw new UnauthorizedException(
        'Unable to load Auth0 discovery document',
      );
    }

    const body = (await response.json()) as Partial<Auth0DiscoveryDocument>;

    if (!body.issuer || !body.jwks_uri) {
      throw new UnauthorizedException('Auth0 discovery document is incomplete');
    }

    return {
      issuer: body.issuer,
      jwks_uri: body.jwks_uri,
    };
  }
}
