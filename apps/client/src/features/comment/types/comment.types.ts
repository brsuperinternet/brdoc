import { IUser } from "@/features/user/types/user.types";
import { QueryParams } from "@/lib/types.ts";

export interface IComment {
  content: string;
  createdAt: Date;
  creator: IUser;
  creatorId: string;
  deletedAt?: Date;
  editedAt?: Date;
  id: string;
  pageId: string;
  parentCommentId?: string;
  resolvedAt?: Date;
  resolvedBy?: IUser;
  resolvedById?: string;
  selection?: string;
  type?: string;
  workspaceId: string;
  yjsSelection?: {
    anchor: any;
    head: any;
  };
}

export interface ICommentData {
  content: any;
  id: string;
  pageId: string;
  parentCommentId?: string;
  selection?: string;
}

export interface IResolveComment {
  commentId: string;
  pageId: string;
  resolved: boolean;
}

export interface ICommentParams extends QueryParams {
  pageId: string;
}
