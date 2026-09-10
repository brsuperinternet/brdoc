import { ISpace } from "@/features/space/types/space.types.ts";

export interface IPage {
  canEdit?: boolean;
  content: string;
  contributors?: IContributor[];
  coverPhoto: string;
  createdAt: Date;
  creator: ICreator;
  creatorId: string;
  deletedAt: Date;
  deletedBy: IDeletedBy;
  hasChildren: boolean;
  icon: string;
  id: string;
  isBase: boolean;
  isLocked: boolean;
  lastUpdatedBy: ILastUpdatedBy;
  lastUpdatedById: string;
  parentPageId: string;
  permissions?: {
    canEdit: boolean;
    hasRestriction: boolean;
  };
  position: string;
  slugId: string;
  space: Partial<ISpace>;
  spaceId: string;
  title: string;
  updatedAt: Date;
  workspaceId: string;
}

export interface IContributor {
  avatarUrl: string;
  id: string;
  name: string;
}

interface ICreator {
  avatarUrl: string;
  id: string;
  name: string;
}
interface ILastUpdatedBy {
  avatarUrl: string;
  id: string;
  name: string;
}

interface IDeletedBy {
  avatarUrl: string;
  id: string;
  name: string;
}

export interface IMovePage {
  after?: string;
  before?: string;
  pageId: string;
  parentPageId?: string;
  position?: string;
}

export interface IMovePageToSpace {
  pageId: string;
  spaceId: string;
}

export interface ICopyPageToSpace {
  pageId: string;
  spaceId?: string;
}

export interface SidebarPagesParams {
  cursor?: string;
  limit?: number;
  pageId?: string;
  spaceId?: string;
}

export interface IPageInput {
  coverPhoto: string;
  icon: string;
  isLocked: boolean;
  pageId: string;
  parentPageId: string;
  position: string;
  title: string;
}

export interface IExportPageParams {
  format: ExportFormat;
  includeAttachments?: boolean;
  includeChildren?: boolean;
  pageId: string;
}

export enum ExportFormat {
  HTML = "html",
  Markdown = "markdown",
  Docx = "docx",
}
