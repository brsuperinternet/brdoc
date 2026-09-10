type EventOption = {
  value: string;
  label: string;
};

type EventGroup = {
  group: string;
  items: EventOption[];
};

export const auditEventLabels: Record<string, string> = {
  "api_key.created": "Created API key",
  "api_key.deleted": "Deleted API key",
  "api_key.updated": "Updated API key",

  "comment.deleted": "Deleted comment",

  "group.created": "Created group",
  "group.deleted": "Deleted group",
  "group.member_added": "Added group member",
  "group.member_removed": "Removed group member",
  "group.updated": "Updated group",

  "license.activated": "Activated license",
  "license.removed": "Removed license",
  "page.approval_rejected": "Rejected page approval",
  "page.approval_requested": "Requested page approval",
  "page.deleted": "Deleted page",
  "page.exported": "Exported page",
  "page.imported": "Imported page",
  "page.marked_obsolete": "Marked page as obsolete",
  "page.permission_added": "Added page permission",
  "page.permission_removed": "Removed page permission",
  "page.permission_role_changed": "Changed page permission",
  "page.restored": "Restored page",
  "page.restricted": "Restricted page",
  "page.restriction_removed": "Removed page restriction",

  "page.trashed": "Trashed page",
  "page.verification_created": "Created page verification",
  "page.verification_removed": "Removed page verification",
  "page.verification_updated": "Updated page verification",
  "page.verified": "Verified page",

  "scim_token.created": "Created SCIM token",
  "scim_token.deleted": "Deleted SCIM token",
  "scim_token.updated": "Updated SCIM token",

  "share.created": "Created share link",
  "share.deleted": "Deleted share link",

  "siem_destination.created": "Created SIEM destination",
  "siem_destination.deleted": "Deleted SIEM destination",
  "siem_destination.updated": "Updated SIEM destination",

  "space.created": "Created space",
  "space.deleted": "Deleted space",
  "space.exported": "Exported space",
  "space.member_added": "Added space member",
  "space.member_removed": "Removed space member",
  "space.member_role_changed": "Changed space member role",
  "space.updated": "Updated space",

  "sso.provider_created": "Created SSO provider",
  "sso.provider_deleted": "Deleted SSO provider",
  "sso.provider_updated": "Updated SSO provider",

  "template.created": "Created template",
  "template.deleted": "Deleted template",
  "user.activated": "Activated user",

  "user.created": "Created user",
  "user.deactivated": "Deactivated user",
  "user.deleted": "Deleted user",
  "user.login": "Logged in",
  "user.logout": "Logged out",
  "user.mfa_backup_code_generated": "Generated MFA backup codes",
  "user.mfa_disabled": "Disabled MFA",
  "user.mfa_enabled": "Enabled MFA",
  "user.password_changed": "Changed password",
  "user.password_reset": "Reset password",
  "user.password_reset_requested": "Requested password reset",
  "user.role_changed": "Changed user role",
  "user.updated": "Updated user",
  "workspace.created": "Created workspace",
  "workspace.invite_created": "Created invitation",
  "workspace.invite_resent": "Resent invitation",
  "workspace.invite_revoked": "Revoked invitation",
  "workspace.updated": "Updated workspace",
};

export function getEventLabel(event: string): string {
  return auditEventLabels[event] ?? event;
}

export const eventFilterOptions: EventGroup[] = [
  {
    group: "Workspace",
    items: [
      { label: "Updated workspace", value: "workspace.updated" },
      { label: "Created invitation", value: "workspace.invite_created" },
      { label: "Revoked invitation", value: "workspace.invite_revoked" },
    ],
  },
  {
    group: "User",
    items: [
      { label: "Logged in", value: "user.login" },
      { label: "Logged out", value: "user.logout" },
      { label: "Created user", value: "user.created" },
      { label: "Deleted user", value: "user.deleted" },
      { label: "Deactivated user", value: "user.deactivated" },
      { label: "Activated user", value: "user.activated" },
      { label: "Changed user role", value: "user.role_changed" },
      { label: "Changed password", value: "user.password_changed" },
      {
        label: "Requested password reset",
        value: "user.password_reset_requested",
      },
      { label: "Enabled MFA", value: "user.mfa_enabled" },
      { label: "Disabled MFA", value: "user.mfa_disabled" },
    ],
  },
  {
    group: "Space",
    items: [
      { label: "Created space", value: "space.created" },
      { label: "Updated space", value: "space.updated" },
      { label: "Deleted space", value: "space.deleted" },
      { label: "Added space member", value: "space.member_added" },
      { label: "Removed space member", value: "space.member_removed" },
    ],
  },
  {
    group: "Group",
    items: [
      { label: "Created group", value: "group.created" },
      { label: "Updated group", value: "group.updated" },
      { label: "Deleted group", value: "group.deleted" },
      { label: "Added group member", value: "group.member_added" },
      { label: "Removed group member", value: "group.member_removed" },
    ],
  },
  {
    group: "Comment",
    items: [{ label: "Deleted comment", value: "comment.deleted" }],
  },
  {
    group: "Page",
    items: [
      { label: "Trashed page", value: "page.trashed" },
      { label: "Deleted page", value: "page.deleted" },
      { label: "Restored page", value: "page.restored" },
      { label: "Imported page", value: "page.imported" },
      { label: "Exported page", value: "page.exported" },
      { label: "Restricted page", value: "page.restricted" },
      { label: "Removed page restriction", value: "page.restriction_removed" },
      { label: "Added page permission", value: "page.permission_added" },
      { label: "Removed page permission", value: "page.permission_removed" },
      {
        label: "Changed page permission",
        value: "page.permission_role_changed",
      },
      {
        label: "Created page verification",
        value: "page.verification_created",
      },
      {
        label: "Updated page verification",
        value: "page.verification_updated",
      },
      {
        label: "Removed page verification",
        value: "page.verification_removed",
      },
      { label: "Verified page", value: "page.verified" },
      { label: "Requested page approval", value: "page.approval_requested" },
      { label: "Rejected page approval", value: "page.approval_rejected" },
      { label: "Marked page as obsolete", value: "page.marked_obsolete" },
    ],
  },
  {
    group: "Share",
    items: [
      { label: "Created share link", value: "share.created" },
      { label: "Deleted share link", value: "share.deleted" },
    ],
  },
  {
    group: "SSO",
    items: [
      { label: "Created SSO provider", value: "sso.provider_created" },
      { label: "Updated SSO provider", value: "sso.provider_updated" },
      { label: "Deleted SSO provider", value: "sso.provider_deleted" },
    ],
  },
  {
    group: "API key",
    items: [
      { label: "Created API key", value: "api_key.created" },
      { label: "Deleted API key", value: "api_key.deleted" },
    ],
  },
  {
    group: "SCIM token",
    items: [
      { label: "Created SCIM token", value: "scim_token.created" },
      { label: "Updated SCIM token", value: "scim_token.updated" },
      { label: "Deleted SCIM token", value: "scim_token.deleted" },
    ],
  },
  {
    group: "License",
    items: [
      { label: "Activated license", value: "license.activated" },
      { label: "Removed license", value: "license.removed" },
    ],
  },
  {
    group: "SIEM",
    items: [
      { label: "Created SIEM destination", value: "siem_destination.created" },
      { label: "Updated SIEM destination", value: "siem_destination.updated" },
      { label: "Deleted SIEM destination", value: "siem_destination.deleted" },
    ],
  },
  {
    group: "Template",
    items: [
      { label: "Created template", value: "template.created" },
      { label: "Deleted template", value: "template.deleted" },
    ],
  },
];
