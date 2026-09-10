export interface QueryParams {
  adminView?: boolean;
  beforeCursor?: string;
  cursor?: string;
  limit?: number;
  query?: string;
}

export enum UserRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

export enum SpaceRole {
  ADMIN = "admin",
  WRITER = "writer",
  READER = "reader",
}

export interface IRoleData {
  description: string;
  label: string;
  value: string;
}

export interface ApiResponse<T> {
  data: T;
}

export type IPaginationMeta = {
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextCursor: string | null;
  prevCursor: string | null;
};
export type IPagination<T> = {
  items: T[];
  meta: IPaginationMeta;
};
