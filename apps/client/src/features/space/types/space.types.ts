import { ExportFormat } from "@/features/page/types/page.types.ts";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import { SpaceRole } from "@/lib/types.ts";

export interface ISpaceSharingSettings {
  disabled?: boolean;
}

export interface ISpaceCommentsSettings {
  allowViewerComments?: boolean;
}

export interface ISpaceSettings {
  comments?: ISpaceCommentsSettings;
  sharing?: ISpaceSharingSettings;
}

export interface ISpace {
  allowViewerComments?: boolean;
  createdAt: Date;
  creatorId: string;
  description: string;
  // for updates
  disablePublicSharing?: boolean;
  hostname: string;
  id: string;
  isPersonal?: boolean;
  isPublished?: boolean;
  logo?: string;
  memberCount?: number;
  membership?: IMembership;
  name: string;
  settings?: ISpaceSettings;
  slug: string;
  spaceId?: string;
  updatedAt: Date;
}

interface IMembership {
  permissions?: Permissions;
  role: SpaceRole;
  userId: string;
}

interface Permission {
  action: SpaceCaslAction;
  subject: SpaceCaslSubject;
}

type Permissions = Permission[];

export interface IAddSpaceMember {
  groupIds?: string[];
  spaceId: string;
  userIds?: string[];
}

export interface IRemoveSpaceMember {
  groupId?: string;
  spaceId: string;
  userId?: string;
}

export interface IChangeSpaceMemberRole {
  groupId?: string;
  spaceId: string;
  userId?: string;
}

// space member
export interface SpaceUserInfo {
  avatarUrl: string;
  email: string;
  id: string;
  name: string;
  type: "user";
}

export interface SpaceGroupInfo {
  id: string;
  isDefault: boolean;
  memberCount: number;
  name: string;
  type: "group";
}

export type ISpaceMember = { role: string } & (SpaceUserInfo | SpaceGroupInfo);

export interface IExportSpaceParams {
  format: ExportFormat;
  includeAttachments?: boolean;
  spaceId: string;
}
