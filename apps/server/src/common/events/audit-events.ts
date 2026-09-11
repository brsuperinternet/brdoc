export const AuditEvent = {
  // API Keys
  API_KEY_CREATED: "api_key.created",
  API_KEY_DELETED: "api_key.deleted",
  API_KEY_UPDATED: "api_key.updated",

  // Attachment
  ATTACHMENT_UPLOADED: "attachment.uploaded",

  // Comment
  COMMENT_CREATED: "comment.created",
  COMMENT_DELETED: "comment.deleted",
  COMMENT_REOPENED: "comment.reopened",
  COMMENT_RESOLVED: "comment.resolved",

  // Comment updates / resolve
  COMMENT_UPDATED: "comment.updated",

  // Group
  GROUP_CREATED: "group.created",
  GROUP_DELETED: "group.deleted",
  GROUP_MEMBER_ADDED: "group.member_added",
  GROUP_MEMBER_REMOVED: "group.member_removed",
  GROUP_UPDATED: "group.updated",

  // License
  LICENSE_ACTIVATED: "license.activated",
  LICENSE_REMOVED: "license.removed",

  // OAuth
  OAUTH_CLIENT_REGISTERED: "oauth_client.registered",
  OAUTH_GRANT_CREATED: "oauth_grant.created",
  OAUTH_GRANT_REVOKED: "oauth_grant.revoked",
  PAGE_APPROVAL_REJECTED: "page.approval_rejected",
  PAGE_APPROVAL_REQUESTED: "page.approval_requested",

  // Page
  PAGE_CREATED: "page.created",
  PAGE_DELETED: "page.deleted",
  PAGE_DUPLICATED: "page.duplicated",
  PAGE_EXPORTED: "page.exported",

  // Import / Export
  PAGE_IMPORTED: "page.imported",
  PAGE_MARKED_OBSOLETE: "page.marked_obsolete",
  PAGE_MOVED_TO_SPACE: "page.moved_to_space",
  PAGE_PERMISSION_ADDED: "page.permission_added",
  PAGE_PERMISSION_REMOVED: "page.permission_removed",
  PAGE_PERMISSION_ROLE_CHANGED: "page.permission_role_changed",
  PAGE_RESTORED: "page.restored",
  // Page permission
  PAGE_RESTRICTED: "page.restricted",
  PAGE_RESTRICTION_REMOVED: "page.restriction_removed",
  PAGE_TRASHED: "page.trashed",
  // Page verification
  PAGE_VERIFICATION_CREATED: "page.verification_created",
  PAGE_VERIFICATION_REMOVED: "page.verification_removed",
  PAGE_VERIFICATION_UPDATED: "page.verification_updated",
  PAGE_VERIFIED: "page.verified",

  // SCIM Tokens
  SCIM_TOKEN_CREATED: "scim_token.created",
  SCIM_TOKEN_DELETED: "scim_token.deleted",
  SCIM_TOKEN_UPDATED: "scim_token.updated",

  // Share
  SHARE_CREATED: "share.created",
  SHARE_DELETED: "share.deleted",
  // ATTACHMENT_DELETED: 'attachment.deleted',

  // SIEM streaming
  SIEM_DESTINATION_CREATED: "siem_destination.created",
  SIEM_DESTINATION_DELETED: "siem_destination.deleted",
  SIEM_DESTINATION_TEST: "siem_destination.test",
  SIEM_DESTINATION_UPDATED: "siem_destination.updated",

  // Space
  SPACE_CREATED: "space.created",
  SPACE_DELETED: "space.deleted",
  SPACE_EXPORTED: "space.exported",
  SPACE_MEMBER_ADDED: "space.member_added",
  SPACE_MEMBER_REMOVED: "space.member_removed",
  SPACE_MEMBER_ROLE_CHANGED: "space.member_role_changed",
  SPACE_UPDATED: "space.updated",

  // SSO provider management
  SSO_PROVIDER_CREATED: "sso.provider_created",
  SSO_PROVIDER_DELETED: "sso.provider_deleted",
  SSO_PROVIDER_UPDATED: "sso.provider_updated",

  // Template
  TEMPLATE_CREATED: "template.created",
  TEMPLATE_DELETED: "template.deleted",
  USER_ACTIVATED: "user.activated",

  // User
  USER_CREATED: "user.created",
  USER_DEACTIVATED: "user.deactivated",
  USER_DELETED: "user.deleted",
  USER_LOGIN: "user.login",
  USER_LOGOUT: "user.logout",
  USER_MFA_BACKUP_CODE_GENERATED: "user.mfa_backup_code_generated",
  USER_MFA_DISABLED: "user.mfa_disabled",

  // MFA
  USER_MFA_ENABLED: "user.mfa_enabled",
  USER_PASSWORD_CHANGED: "user.password_changed",
  USER_PASSWORD_RESET: "user.password_reset",
  USER_PASSWORD_RESET_REQUESTED: "user.password_reset_requested",
  USER_ROLE_CHANGED: "user.role_changed",
  USER_UPDATED: "user.updated",
  // Workspace
  WORKSPACE_CREATED: "workspace.created",
  WORKSPACE_INVITE_CREATED: "workspace.invite_created",
  WORKSPACE_INVITE_RESENT: "workspace.invite_resent",
  WORKSPACE_INVITE_REVOKED: "workspace.invite_revoked",
  WORKSPACE_UPDATED: "workspace.updated",
} as const;

export type AuditEventType = (typeof AuditEvent)[keyof typeof AuditEvent];

export const EXCLUDED_AUDIT_EVENTS: Set<string> = new Set([
  AuditEvent.PAGE_CREATED,
  AuditEvent.PAGE_MOVED_TO_SPACE,
  AuditEvent.PAGE_DUPLICATED,
  AuditEvent.COMMENT_CREATED,
  AuditEvent.COMMENT_UPDATED,
  AuditEvent.COMMENT_RESOLVED,
  AuditEvent.COMMENT_REOPENED,
  AuditEvent.ATTACHMENT_UPLOADED,
  AuditEvent.SIEM_DESTINATION_TEST,
]);

export const AuditResource = {
  API_KEY: "api_key",
  ATTACHMENT: "attachment",
  COMMENT: "comment",
  GROUP: "group",
  LICENSE: "license",
  OAUTH_CLIENT: "oauth_client",
  OAUTH_GRANT: "oauth_grant",
  PAGE: "page",
  SCIM_TOKEN: "scim_token",
  SHARE: "share",
  SIEM_DESTINATION: "siem_destination",
  SPACE: "space",
  SPACE_MEMBER: "space_member",
  SSO_PROVIDER: "sso_provider",
  TEMPLATE: "template",
  USER: "user",
  WORKSPACE: "workspace",
  WORKSPACE_INVITATION: "workspace_invitation",
} as const;

export type AuditResourceType =
  (typeof AuditResource)[keyof typeof AuditResource];

export type ActorType = "user" | "system" | "api_key";

export interface AuditLogPayload {
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  event: AuditEventType;
  metadata?: Record<string, any>;
  resourceId?: string;
  resourceType: AuditResourceType;
  spaceId?: string;
}

export interface AuditLogData extends AuditLogPayload {
  actorId?: string;
  actorType: ActorType;
  ipAddress?: string;
  userAgent?: string;
  workspaceId: string;
}
