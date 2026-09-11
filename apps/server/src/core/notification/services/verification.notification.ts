import { PagePermissionRepo } from "@docmost/db/repos/page/page-permission.repo";
import { SpaceMemberRepo } from "@docmost/db/repos/space/space-member.repo";
import { KyselyDB } from "@docmost/db/types/kysely.types";
import { ApprovalRejectedEmail } from "@docmost/transactional/emails/approval-rejected-email";
import { ApprovalRequestedEmail } from "@docmost/transactional/emails/approval-requested-email";
import { VerificationExpiredEmail } from "@docmost/transactional/emails/verification-expired-email";
import { VerificationExpiringEmail } from "@docmost/transactional/emails/verification-expiring-email";
import { Injectable } from "@nestjs/common";
import { InjectKysely } from "nestjs-kysely";
import { getPageTitle } from "../../../common/helpers";
import {
  IApprovalRejectedNotificationJob,
  IApprovalRequestedNotificationJob,
  IPageVerifiedNotificationJob,
  IVerificationExpiredNotificationJob,
  IVerificationExpiringNotificationJob,
} from "../../../integrations/queue/constants/queue.interface";
import { NotificationType } from "../notification.constants";
import { NotificationService } from "../notification.service";

@Injectable()
export class VerificationNotificationService {
  constructor(
    @InjectKysely() private readonly db: KyselyDB,
    private readonly notificationService: NotificationService,
    private readonly spaceMemberRepo: SpaceMemberRepo,
    private readonly pagePermissionRepo: PagePermissionRepo,
  ) {}

  private async getAlreadyNotifiedUserIds(
    pageVerificationId: string,
    type: string
  ): Promise<Set<string>> {
    const rows = await this.db
      .selectFrom("notifications")
      .select("userId")
      .where("pageVerificationId", "=", pageVerificationId)
      .where("type", "=", type)
      .execute();
    return new Set(rows.map((r) => r.userId));
  }

  private async filterAccessibleRecipients(
    userIds: string[],
    pageId: string,
    spaceId: string
  ): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }
    const inSpace = await this.spaceMemberRepo.getUserIdsWithSpaceAccess(
      userIds,
      spaceId
    );
    if (inSpace.size === 0) {
      return [];
    }
    return this.pagePermissionRepo.getUserIdsWithPageAccess(pageId, [
      ...inSpace,
    ]);
  }

  async processVerificationExpiring(
    data: IVerificationExpiringNotificationJob,
    appUrl: string
  ) {
    const verification = await this.db
      .selectFrom("pageVerifications")
      .selectAll()
      .where("id", "=", data.verificationId)
      .executeTakeFirst();

    if (!verification) {
      return;
    }
    if (verification.type !== "expiring") {
      return;
    }
    if (!verification.expiresAt) {
      return;
    }
    const expiresAtMs = new Date(verification.expiresAt).getTime();
    if (expiresAtMs <= Date.now()) {
      return;
    }

    const verifierRows = await this.db
      .selectFrom("pageVerifiers")
      .select("userId")
      .where("pageVerificationId", "=", verification.id)
      .execute();
    const verifierIds = verifierRows.map((r) => r.userId);
    if (verifierIds.length === 0) {
      return;
    }

    const accessibleVerifierIds = await this.filterAccessibleRecipients(
      verifierIds,
      verification.pageId,
      verification.spaceId
    );
    if (accessibleVerifierIds.length === 0) {
      return;
    }

    const alreadyNotified = await this.getAlreadyNotifiedUserIds(
      verification.id,
      NotificationType.PAGE_VERIFICATION_EXPIRING
    );
    const recipients = accessibleVerifierIds.filter(
      (id) => !alreadyNotified.has(id)
    );
    if (recipients.length === 0) {
      return;
    }

    const context = await this.getPageContext(
      verification.pageId,
      verification.spaceId,
      appUrl
    );
    if (!context) {
      return;
    }

    const { pageTitle, spaceName, basePageUrl } = context;
    const expiresAtIso = new Date(verification.expiresAt).toISOString();

    for (const userId of recipients) {
      const notification = await this.notificationService.create({
        data: { expiresAt: expiresAtIso },
        pageId: verification.pageId,
        pageVerificationId: verification.id,
        spaceId: verification.spaceId,
        type: NotificationType.PAGE_VERIFICATION_EXPIRING,
        userId,
        workspaceId: verification.workspaceId,
      });

      const subject = `"${pageTitle}" needs to be re-verified soon`;

      await this.notificationService.queueEmail(
        userId,
        notification.id,
        subject,
        VerificationExpiringEmail({
          expiresAt: new Date(verification.expiresAt).toLocaleDateString(),
          pageTitle,
          pageUrl: basePageUrl,
          spaceName,
        })
      );
    }
  }

  async processVerificationExpired(
    data: IVerificationExpiredNotificationJob,
    appUrl: string
  ) {
    const verification = await this.db
      .selectFrom("pageVerifications")
      .selectAll()
      .where("id", "=", data.verificationId)
      .executeTakeFirst();

    if (!verification) {
      return;
    }
    if (verification.type !== "expiring") {
      return;
    }
    if (!verification.expiresAt) {
      return;
    }
    if (new Date(verification.expiresAt).getTime() > Date.now()) {
      return;
    }

    const verifierRows = await this.db
      .selectFrom("pageVerifiers")
      .select("userId")
      .where("pageVerificationId", "=", verification.id)
      .execute();
    const verifierIds = verifierRows.map((r) => r.userId);
    if (verifierIds.length === 0) {
      return;
    }

    const accessibleVerifierIds = await this.filterAccessibleRecipients(
      verifierIds,
      verification.pageId,
      verification.spaceId
    );
    if (accessibleVerifierIds.length === 0) {
      return;
    }

    const alreadyNotified = await this.getAlreadyNotifiedUserIds(
      verification.id,
      NotificationType.PAGE_VERIFICATION_EXPIRED
    );
    const recipients = accessibleVerifierIds.filter(
      (id) => !alreadyNotified.has(id)
    );
    if (recipients.length === 0) {
      return;
    }

    const context = await this.getPageContext(
      verification.pageId,
      verification.spaceId,
      appUrl
    );
    if (!context) {
      return;
    }

    const { pageTitle, spaceName, basePageUrl } = context;

    for (const userId of recipients) {
      const notification = await this.notificationService.create({
        pageId: verification.pageId,
        pageVerificationId: verification.id,
        spaceId: verification.spaceId,
        type: NotificationType.PAGE_VERIFICATION_EXPIRED,
        userId,
        workspaceId: verification.workspaceId,
      });

      const subject = `"${pageTitle}" verification has expired`;

      await this.notificationService.queueEmail(
        userId,
        notification.id,
        subject,
        VerificationExpiredEmail({
          pageTitle,
          pageUrl: basePageUrl,
          spaceName,
        })
      );
    }
  }

  async processPageVerified(data: IPageVerifiedNotificationJob) {
    const { verifierIds, pageId, spaceId, workspaceId, actorId } = data;
    if (verifierIds.length === 0) {
      return;
    }

    const accessibleVerifierIds = await this.filterAccessibleRecipients(
      verifierIds,
      pageId,
      spaceId
    );
    if (accessibleVerifierIds.length === 0) {
      return;
    }

    for (const userId of accessibleVerifierIds) {
      await this.notificationService.create({
        actorId,
        pageId,
        spaceId,
        type: NotificationType.PAGE_VERIFIED,
        userId,
        workspaceId,
      });
    }
  }

  async processApprovalRequested(
    data: IApprovalRequestedNotificationJob,
    appUrl: string
  ) {
    const { verifierIds, pageId, spaceId, workspaceId, actorId } = data;
    if (verifierIds.length === 0) {
      return;
    }

    const accessibleVerifierIds = await this.filterAccessibleRecipients(
      verifierIds,
      pageId,
      spaceId
    );
    if (accessibleVerifierIds.length === 0) {
      return;
    }

    const context = await this.getPageContext(pageId, spaceId, appUrl);
    if (!context) {
      return;
    }

    const { pageTitle, spaceName, basePageUrl } = context;
    const actorName = await this.getUserName(actorId);

    for (const userId of accessibleVerifierIds) {
      const notification = await this.notificationService.create({
        actorId,
        pageId,
        spaceId,
        type: NotificationType.PAGE_APPROVAL_REQUESTED,
        userId,
        workspaceId,
      });

      const subject = `"${pageTitle}" needs your approval`;

      await this.notificationService.queueEmail(
        userId,
        notification.id,
        subject,
        ApprovalRequestedEmail({
          actorName,
          pageTitle,
          pageUrl: basePageUrl,
          spaceName,
        })
      );
    }
  }

  async processApprovalRejected(
    data: IApprovalRejectedNotificationJob,
    appUrl: string
  ) {
    const { pageId, spaceId, workspaceId, actorId, requestedById, comment } =
      data;

    const recipients = await this.filterAccessibleRecipients(
      [requestedById],
      pageId,
      spaceId
    );
    if (recipients.length === 0) {
      return;
    }

    const context = await this.getPageContext(pageId, spaceId, appUrl);
    if (!context) {
      return;
    }

    const { pageTitle, spaceName, basePageUrl } = context;
    const actorName = await this.getUserName(actorId);

    const notification = await this.notificationService.create({
      actorId,
      pageId,
      spaceId,
      type: NotificationType.PAGE_APPROVAL_REJECTED,
      userId: requestedById,
      workspaceId,
    });

    const subject = `"${pageTitle}" was returned for revision`;

    await this.notificationService.queueEmail(
      requestedById,
      notification.id,
      subject,
      ApprovalRejectedEmail({
        actorName,
        comment,
        pageTitle,
        pageUrl: basePageUrl,
        spaceName,
      })
    );
  }

  private async getUserName(userId: string): Promise<string> {
    const user = await this.db
      .selectFrom("users")
      .select("name")
      .where("id", "=", userId)
      .executeTakeFirst();
    return user?.name ?? "Someone";
  }

  private async getPageContext(
    pageId: string,
    spaceId: string,
    appUrl: string
  ) {
    const [page, space] = await Promise.all([
      this.db
        .selectFrom("pages")
        .select(["id", "title", "slugId"])
        .where("id", "=", pageId)
        .executeTakeFirst(),
      this.db
        .selectFrom("spaces")
        .select(["id", "slug", "name"])
        .where("id", "=", spaceId)
        .executeTakeFirst(),
    ]);

    if (!page || !space) {
      return null;
    }

    const basePageUrl = `${appUrl}/s/${space.slug}/p/${page.slugId}`;
    return {
      basePageUrl,
      pageTitle: getPageTitle(page.title),
      spaceName: space.name ?? space.slug,
    };
  }
}
