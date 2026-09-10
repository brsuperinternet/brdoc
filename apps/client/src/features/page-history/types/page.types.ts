interface IPageHistoryUser {
  avatarUrl: string;
  id: string;
  name: string;
}

export interface IPageHistory {
  content?: any;
  contributors?: IPageHistoryUser[];
  coverPhoto: string;
  createdAt: string;
  icon: string;
  id: string;
  lastUpdatedBy: IPageHistoryUser;
  lastUpdatedById: string;
  pageId: string;
  slug: string;
  title: string;
  updatedAt: string;
  version: number;
  workspaceId: string;
}
