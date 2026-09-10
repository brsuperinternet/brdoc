import { IGroup } from "@/features/group/types/group.types.ts";
import { IPage } from "@/features/page/types/page.types.ts";
import { ISpace } from "@/features/space/types/space.types.ts";
import { IUser } from "@/features/user/types/user.types.ts";

export interface IPageSearch {
  createdAt: Date;
  creatorId: string;
  highlight: string;
  icon: string;
  id: string;
  matchedText: string[];
  parentPageId: string;
  rank: string;
  slugId: string;
  space: Partial<ISpace>;
  title: string;
  updatedAt: Date;
  wholeWord: boolean;
}

export interface SearchSuggestionParams {
  includeGroups?: boolean;
  includePages?: boolean;
  includeUsers?: boolean;
  limit?: number;
  query: string;
  spaceId?: string;
}

export interface ISuggestionResult {
  groups?: Partial<IGroup[]>;
  pages?: Partial<IPage[]>;
  users?: Partial<IUser[]>;
}

export interface IPageSearchParams {
  creatorId?: string;
  labelIds?: string[];
  query: string;
  shareId?: string;
  spaceId?: string;
  titleOnly?: boolean;
}

export interface IAttachmentSearch {
  createdAt: Date;
  creatorId: string;
  fileName: string;
  highlight: string;
  id: string;
  page: {
    id: string;
    title: string;
    slugId: string;
  };
  pageId: string;
  rank: string;
  space: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  updatedAt: Date;
}
