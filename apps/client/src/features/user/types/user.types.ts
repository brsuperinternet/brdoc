import { IWorkspace } from "@/features/workspace/types/workspace.types";

export interface IUser {
  avatarUrl: string;
  createdAt: Date;
  deactivatedAt: Date;
  deletedAt: Date;
  editorToolbar: boolean; // used for update
  email: string;
  emailVerifiedAt: Date;
  fullPageWidth: boolean; // used for update
  hasGeneratedPassword?: boolean;
  id: string;
  invitedById: string;
  lastActiveAt: Date;
  lastLoginAt: string;
  locale: string;
  name: string;
  notificationCommentCreated: boolean; // used for update
  notificationCommentResolved: boolean; // used for update
  notificationCommentUserMention: boolean; // used for update
  notificationPageUpdates: boolean; // used for update
  notificationPageUserMention: boolean; // used for update
  pageEditMode: string; // used for update
  role: string;
  settings: IUserSettings;
  timezone: string;
  updatedAt: Date;
  workspaceId: string;
}

export interface ICurrentUser {
  user: IUser;
  workspace: IWorkspace;
}

export interface IUserSettings {
  notifications?: {
    "page.updated"?: boolean;
    "page.userMention"?: boolean;
    "comment.userMention"?: boolean;
    "comment.created"?: boolean;
    "comment.resolved"?: boolean;
  };
  preferences: {
    fullPageWidth: boolean;
    pageEditMode: string;
    editorToolbar: boolean;
  };
}

export enum PageEditMode {
  Read = "read",
  Edit = "edit",
}
