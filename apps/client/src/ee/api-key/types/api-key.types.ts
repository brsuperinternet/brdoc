import { IUser } from "@/features/user/types/user.types.ts";

export interface IApiKey {
  createdAt: string;
  creator: Partial<IUser>;
  creatorId: string;
  expiresAt: string | null;
  id: string;
  lastUsedAt: string | null;
  name: string;
  token?: string;
  workspaceId: string;
}

export interface ICreateApiKeyRequest {
  expiresAt?: string;
  name: string;
}

export interface IUpdateApiKeyRequest {
  apiKeyId: string;
  name: string;
}
