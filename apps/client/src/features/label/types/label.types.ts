import { QueryParams } from "@/lib/types.ts";

export type LabelType = "page" | "space";

export interface ILabel {
  createdAt: string;
  id: string;
  name: string;
  type: LabelType;
  updatedAt: string;
  workspaceId: string;
}

export interface IAddLabels {
  names: string[];
  pageId: string;
}

export interface IRemoveLabel {
  labelId: string;
  pageId: string;
}

export interface IPageLabelsParams {
  cursor?: string;
  limit?: number;
  pageId: string;
}

export interface IListLabelsParams {
  cursor?: string;
  limit?: number;
  query?: string;
  type: LabelType;
}

export interface ILabelInfo {
  name: string;
  usageCount: number;
}

export interface ILabelPageItem {
  createdAt: string;
  creator: { id: string; name: string; avatarUrl: string | null } | null;
  icon: string | null;
  id: string;
  labels: { id: string; name: string }[];
  slugId: string;
  space: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
  spaceId: string;
  title: string | null;
  updatedAt: string;
}

export interface IFindPagesByLabelParams extends QueryParams {
  labelId?: string;
  name?: string;
  spaceId?: string;
}

export interface ILabelInfoParams {
  name: string;
  spaceId?: string;
  type: LabelType;
}
