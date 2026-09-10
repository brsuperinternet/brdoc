export interface IAttachment {
  createdAt: string;
  creatorId: string;
  deletedAt: string | null;
  fileExt: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  id: string;
  mimeType: string;
  pageId: string | null;
  spaceId: string | null;
  type: string;
  updatedAt: string;
  workspaceId: string;
}

export interface IPageAttachment extends IAttachment {
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  url: string;
}

export enum AvatarIconType {
  AVATAR = "avatar",
  SPACE_ICON = "space-icon",
  WORKSPACE_ICON = "workspace-icon",
}

export enum AttachmentType {
  AVATAR = "avatar",
  WORKSPACE_ICON = "workspace-icon",
  SPACE_ICON = "space-icon",
  FILE = "file",
}
