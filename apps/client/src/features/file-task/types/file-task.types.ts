export interface IFileTask {
  createdAt: string;
  creatorId: string;
  deletedAt: string | null;
  errorMessage: string | null;
  fileExt: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  id: string;
  source: string;
  spaceId: string;
  status: string;
  type: "import" | "export";
  updatedAt: string;
  workspaceId: string;
}
