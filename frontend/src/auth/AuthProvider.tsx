import { Auth0Provider } from '@auth0/auth0-react';
import type { ReactNode } from 'react';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const callbackUrl = import.meta.env.VITE_AUTH0_CALLBACK_URL;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: callbackUrl,
        audience: audience,
        scope: 'openid profile email',
      }}
      // Core invariant: MUST store tokens in memory only, strictly NO localStorage
      cacheLocation="memory"
      useRefreshTokens={false}
    >
      {children}
    </Auth0Provider>
  );
};
