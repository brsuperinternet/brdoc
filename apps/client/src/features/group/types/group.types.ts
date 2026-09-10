export interface IGroup {
  createdAt: Date;
  creatorId: string | null;
  description: string | null;
  groupId: string;
  id: string;
  isDefault: boolean;
  memberCount: number;
  name: string;
  updatedAt: Date;
  workspaceId: string;
}
