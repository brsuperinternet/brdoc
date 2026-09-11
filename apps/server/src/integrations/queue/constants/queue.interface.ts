import { MentionNode } from "../../../common/helpers/prosemirror/utils";

export interface IPageBacklinkJob {
  internalLinkSlugIds?: string[];
  mentions: MentionNode[];
  pageId: string;
  workspaceId: string;
}

export interface IAddPageWatchersJob {
  pageId: string;
  spaceId: string;
  userIds: string[];
  workspaceId: string;
}

export interface IStripeSeatsSyncJob {
  workspaceId: string;
}

export interface IPageHistoryJob {
  pageId: string;
}

export interface INotificationCreateJob {
  actorId?: string;
  commentId?: string;
  data?: Record<string, unknown>;
  pageId?: string;
  spaceId?: string;
  type: string;
  userId: string;
  workspaceId: string;
}

export interface ICommentNotificationJob {
  actorId: string;
  commentId: string;
  mentionedUserIds: string[];
  notifyWatchers: boolean;
  pageId: string;
  parentCommentId?: string;
  spaceId: string;
  workspaceId: string;
}

export interface ICommentResolvedNotificationJob {
  actorId: string;
  commentCreatorId: string;
  commentId: string;
  pageId: string;
  spaceId: string;
  workspaceId: string;
}

export interface IPageMentionNotificationJob {
  oldMentionedUserIds: string[];
  pageId: string;
  spaceId: string;
  userMentions: { userId: string; mentionId: string; creatorId: string }[];
  workspaceId: string;
}

export interface IPageUpdateNotificationJob {
  actorIds: string[];
  pageId: string;
  spaceId: string;
  workspaceId: string;
}

export interface IPermissionGrantedNotificationJob {
  actorId: string;
  pageId: string;
  role: string;
  spaceId: string;
  userIds: string[];
  workspaceId: string;
}

export interface IVerificationExpiringNotificationJob {
  verificationId: string;
}

export interface IVerificationExpiredNotificationJob {
  verificationId: string;
}

export interface IVerificationReconcileJob {
  // no payload
}

export interface IPageVerifiedNotificationJob {
  actorId: string;
  pageId: string;
  spaceId: string;
  verifierIds: string[];
  workspaceId: string;
}

export interface IApprovalRequestedNotificationJob {
  actorId: string;
  pageId: string;
  spaceId: string;
  verifierIds: string[];
  workspaceId: string;
}

export interface IApprovalRejectedNotificationJob {
  actorId: string;
  comment?: string;
  pageId: string;
  requestedById: string;
  spaceId: string;
  workspaceId: string;
}

export interface IBaseTypeConversionJob {
  actorId?: string;
  // When true, the job nulls the cell values for that property instead of
  // attempting a value conversion. Used for any conversion where the new
  // type has no meaningful representation of the old value (e.g. involving
  // a system type).
  clearMode: boolean;
  fromType: string;
  // Snapshots taken at enqueue time so the job stays correct even if the
  // property's current typeOptions drift while the job waits in the queue.
  fromTypeOptions: unknown;
  pageId: string;
  // Staging identity: guards redelivery and failure cleanup against a
  // same-type re-stage made after this job was enqueued.
  pendingToken: string;
  propertyId: string;
  toType: string;
  toTypeOptions: unknown;
  workspaceId: string;
}

export interface IBaseCellGcJob {
  pageId: string;
  propertyId: string;
  workspaceId: string;
}

export interface IBaseFormulaRecomputeJob {
  actorId?: string | null;
  pageId: string;
  propertyIds: string[]; // formula properties to recompute
  reason:
    | "formula_created"
    | "formula_edited"
    | "dep_type_changed"
    | "dep_deleted"
    | "bulk_import"
    | "manual";
  // When set, scope recompute to these row IDs instead of the whole base.
  // Used by the bulk-write path (> FORMULA_INLINE_ROW_THRESHOLD).
  rowIds?: string[];
  workspaceId: string;
}
