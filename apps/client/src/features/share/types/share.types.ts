import { IPage } from "@/features/page/types/page.types.ts";

export interface IShare {
  createdAt: string;
  creatorId: string;
  deletedAt: string | null;
  id: string;
  includeSubPages: boolean;
  key: string;
  pageId: string;
  searchIndexing: boolean;
  sharedPage?: ISharePage;
  spaceId: string;
  updatedAt: string;
  workspaceId: string;
}

export interface ISharedItem extends IShare {
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  page: {
    id: string;
    title: string;
    slugId: string;
    icon: string | null;
  };
  space: {
    id: string;
    name: string;
    slug: string;
    userRole: string;
  };
}

export interface ISharedPage extends IShare {
  features?: string[];
  page: IPage;
  share: IShare & {
    level: number;
    sharedPage: { id: string; slugId: string; title: string; icon: string };
  };
}

export interface IShareForPage extends IShare {
  level: number;
  sharedPage: ISharePage;
}

interface ISharePage {
  icon: string;
  id: string;
  slugId: string;
  title: string;
}

export interface ICreateShare {
  includeSubPages?: boolean;
  pageId?: string;
  searchIndexing?: boolean;
}

export type IUpdateShare = ICreateShare & { shareId: string; pageId?: string };

export interface IShareInfoInput {
  pageId: string;
}

export interface ISharedPageTree {
  features?: string[];
  pageTree: Partial<IPage[]>;
  share: IShare;
}
