import { IAuthProvider } from "@/ee/security/types/security.types.ts";

export interface IWorkspace {
  aiChatReadOnly?: boolean;
  aiChatWorkspaceKnowledgeOnly?: boolean;
  aiSearch?: boolean;
  allowMemberTemplates?: boolean;
  allowPersonalSpaces?: boolean;
  allowPublicSpaces?: boolean;
  billingEmail: string;
  createdAt: Date;
  customDomain: string;
  defaultPageEditMode?: string;
  defaultSpaceId: string;
  description: string;
  disablePublicSharing?: boolean;
  emailDomains: string[];
  enableInvite: boolean;
  enforceMcpOauth?: boolean;
  enforceMfa?: boolean;
  enforceSso: boolean;
  generativeAi?: boolean;
  hostname: string;
  id: string;
  isScimEnabled?: boolean;
  logo: string;
  mcpEnabled?: boolean;
  memberCount?: number;
  name: string;
  plan?: string;
  publicSpacesDirectory?: boolean;
  restrictApiToAdmins?: boolean;
  settings: IWorkspaceSettings;
  status: string;
  stripeCustomerId: string;
  trashRetentionDays?: number;
  trialEndAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceSettings {
  ai?: IWorkspaceAiSettings;
  api?: IWorkspaceApiSettings;
  defaultPageEditMode?: string;
  publicSpaces?: IWorkspacePublicSpacesSettings;
  sharing?: IWorkspaceSharingSettings;
  spaces?: IWorkspaceSpaceSettings;
  templates?: IWorkspaceTemplateSettings;
}

export interface IWorkspaceApiSettings {
  restrictToAdmins?: boolean;
}

export interface IWorkspaceAiSettings {
  chat?: boolean;
  chatReadOnly?: boolean;
  chatWorkspaceKnowledgeOnly?: boolean;
  enforceMcpOauth?: boolean;
  generative?: boolean;
  mcp?: boolean;
  search?: boolean;
}

export interface IWorkspaceSharingSettings {
  disabled?: boolean;
}

export interface IWorkspaceTemplateSettings {
  allowMemberTemplates?: boolean;
}

export interface IWorkspaceSpaceSettings {
  allowPersonal?: boolean;
}

export interface IWorkspacePublicSpacesSettings {
  directory?: boolean;
  enabled?: boolean;
}

export interface ICreateInvite {
  emails: string[];
  groupIds: string[];
  role: string;
}

export interface IInvitation {
  createdAt: Date;
  email: string;
  enforceSso: boolean;
  id: string;
  invitedById: string;
  role: string;
  workspaceId: string;
}

export interface IInvitationLink {
  inviteLink: string;
}

export interface IAcceptInvite {
  invitationId: string;
  name: string;
  password: string;
  token: string;
}

export interface IPublicWorkspace {
  authProviders: IAuthProvider[];
  enforceSso: boolean;
  hostname: string;
  id: string;
  logo: string;
  name: string;
}

export interface IVersion {
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
}
