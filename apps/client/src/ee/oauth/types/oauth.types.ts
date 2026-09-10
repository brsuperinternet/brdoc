export interface IOAuthAuthorizeInfo {
  clientCreatedAt: string;
  clientName: string;
  redirectUri: string;
  scopes: string[];
  verified: boolean;
}

export interface IOAuthGrant {
  clientName: string;
  createdAt: string;
  id: string;
  lastUsedAt: string | null;
  redirectUris: string[];
  scopes: string[];
}

export type IAuthorizeParams = Record<string, string>;

export type IApproveAuthorizationPayload = {
  [param: string]: unknown;
  approved: boolean;
  approvedScopes?: string[];
};
