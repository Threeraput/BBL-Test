import { AuthService } from './auth.service';

describe('AuthService integration (real Auth0 discovery + JWKS)', () => {
  it(
    'should fetch the real discovery document and verify that the JWKS endpoint is reachable',
    async () => {
      const service = new AuthService();

      const discoveryDocument = await service.fetchDiscoveryDocument();

      expect(discoveryDocument.issuer).toBe('https://dev-yg.us.auth0.com/');
      expect(discoveryDocument.jwks_uri).toMatch(
        /^https:\/\/dev-yg\.us\.auth0\.com\//,
      );

      const jwksResponse = await fetch(discoveryDocument.jwks_uri);
      expect(jwksResponse.ok).toBe(true);

      const jwksBody = (await jwksResponse.json()) as {
        keys?: unknown[];
      };

      expect(Array.isArray(jwksBody.keys)).toBe(true);
      expect(jwksBody.keys?.length ?? 0).toBeGreaterThan(0);
    },
    15000,
  );
});
