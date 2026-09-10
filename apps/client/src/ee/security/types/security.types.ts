import { SSO_PROVIDER } from "@/ee/security/contants.ts";

export interface IAuthProvider {
  allowSignup: boolean;
  createdAt: Date;
  creatorId: string;
  deletedAt: Date;
  groupSync: boolean;
  id: string;
  isEnabled: boolean;
  ldapBaseDn: string;
  ldapBindDn: string;
  ldapBindPassword: string;
  ldapTlsCaCert: string;
  ldapTlsEnabled: boolean;
  ldapUrl: string;
  ldapUserAttributes: any;
  ldapUserSearchFilter: string;
  name: string;
  oidcClientId: string;
  oidcClientSecret: string;
  oidcIssuer: string;
  providerId: string;
  samlCertificate: string;
  samlUrl: string;
  type: SSO_PROVIDER;
  updatedAt: Date;
  workspaceId: string;
}
