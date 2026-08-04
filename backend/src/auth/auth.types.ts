import type { Request } from 'express';
import type { VerifiedAccessTokenPayload } from './auth.service';

export type AuthenticatedRequest = Request & {
  auth?: {
    token: string;
    subject: string;
    payload: VerifiedAccessTokenPayload;
  };
};
