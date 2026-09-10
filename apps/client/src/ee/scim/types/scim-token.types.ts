import { IUser } from "@/features/user/types/user.types.ts";

export interface IScimToken {
  createdAt: string;
  creator?: Partial<IUser>;
  creatorId: string;
  id: string;
  isEnabled: boolean;
  lastUsedAt: string | null;
  name: string;
  token?: string;
  tokenLastFour: string;
  workspaceId: string;
}

export interface ICreateScimTokenRequest {
  name: string;
}

export interface IUpdateScimTokenRequest {
  name: string;
  tokenId: string;
}

export interface IRevokeScimTokenRequest {
  tokenId: string;
}
