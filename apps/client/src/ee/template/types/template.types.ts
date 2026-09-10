export interface ITemplate {
  content?: any;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  creatorId: string;
  description?: string;
  icon?: string;
  id: string;
  lastUpdatedById?: string;
  spaceId?: string;
  title: string;
  updatedAt: string;
  workspaceId: string;
}
