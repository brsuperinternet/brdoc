import { IPage } from "@/features/page/types/page.types.ts";

export interface IPublicSpaceSummary {
  description?: string;
  id: string;
  logo?: string;
  name: string;
  slug: string;
}

export interface IPublicSpaceAppearance {
  primaryColorDark?: string;
  primaryColorLight?: string;
}

export interface IPublicSpaceByline {
  author: boolean;
  updatedAt: boolean;
}

export interface IPublicSpaceInfo {
  appearance?: IPublicSpaceAppearance;
  features?: string[];
  searchIndexing: boolean;
  space: IPublicSpaceSummary;
}

export interface IPublicSpaceTree {
  appearance?: IPublicSpaceAppearance;
  features?: string[];
  pageTree: Partial<IPage[]>;
  space: IPublicSpaceSummary;
}

export interface IPublicSpacePage {
  appearance?: IPublicSpaceAppearance;
  byline?: IPublicSpaceByline;
  features?: string[];
  page: IPage | null;
  searchIndexing: boolean;
  space: IPublicSpaceSummary;
}

export interface IPublicSpace {
  createdAt: string;
  creatorId?: string;
  enabled: boolean;
  id: string;
  searchIndexing: boolean;
  settings?: {
    appearance?: IPublicSpaceAppearance;
    byline?: Partial<IPublicSpaceByline>;
    directory?: boolean;
  } | null;
  spaceId: string;
  updatedAt: string;
  workspaceId: string;
}

export interface IPublishedSpaceItem {
  createdAt: string;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  id: string;
  searchIndexing: boolean;
  settings?: IPublicSpace["settings"];
  space: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    userRole: string;
  };
  spaceId: string;
  updatedAt: string;
  workspaceId: string;
}

export interface IPublishSpace {
  appearance?: {
    primaryColorLight?: string | null;
    primaryColorDark?: string | null;
  };
  bylineAuthor?: boolean;
  bylineUpdatedAt?: boolean;
  directory?: boolean;
  enabled: boolean;
  searchIndexing?: boolean;
  spaceId: string;
}

export interface IPublicSpaceDirectoryEntry {
  description?: string;
  logo?: string;
  name: string;
  slug: string;
}

export interface IPublicSpaceDirectory {
  features?: string[];
  spaces: IPublicSpaceDirectoryEntry[];
}
