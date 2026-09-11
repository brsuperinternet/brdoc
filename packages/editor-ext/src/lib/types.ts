// repetition for now
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
