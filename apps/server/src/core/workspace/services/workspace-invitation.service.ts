import { executeWithCursorPagination } from "@docmost/db/pagination/cursor-pagination";
import { PaginationOptions } from "@docmost/db/pagination/pagination-options";
import { GroupUserRepo } from "@docmost/db/repos/group/group-user.repo";
import { UserRepo } from "@docmost/db/repos/user/user.repo";
import {
  Group,
  User,
  Workspace,
  WorkspaceInvitation,
} from "@docmost/db/types/entity.types";
import { KyselyDB } from "@docmost/db/types/kysely.types";
import { executeTx } from "@docmost/db/utils";
import InvitationAcceptedEmail from "@docmost/transactional/emails/invitation-accepted-email";
import InvitationEmail from "@docmost/transactional/emails/invitation-email";
import { InjectQueue } from "@nestjs/bullmq";
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Queue } from "bullmq";
import { sql } from "kysely";
import { InjectKysely } from "nestjs-kysely";
import { DomainService } from "src/integrations/environment/domain.service";
import { AuditEvent, AuditResource } from "../../../common/events/audit-events";
import { nanoIdGen } from "../../../common/helpers";
import {
  AUDIT_SERVICE,
  IAuditService,
} from "../../../integrations/audit/audit.service";
import { EnvironmentService } from "../../../integrations/environment/environment.service";
import { MailService } from "../../../integrations/mail/mail.service";
import { QueueJob, QueueName } from "../../../integrations/queue/constants";
import {
  validateAllowedEmail,
  validateSsoEnforcement,
} from "../../auth/auth.util";
import { TokenService } from "../../auth/services/token.service";
import { SessionService } from "../../session/session.service";
import { AcceptInviteDto, InviteUserDto } from "../dto/invitation.dto";
import {
  getWorkspaceDefaultPageEditMode,
  isAdminActingOnOwner,
} from "../workspace.util";

@Injectable()
export class WorkspaceInvitationService {
  private readonly logger = new Logger(WorkspaceInvitationService.name);
  constructor(
    private userRepo: UserRepo,
    private groupUserRepo: GroupUserRepo,
    private mailService: MailService,
    private domainService: DomainService,
    private tokenService: TokenService,
    private sessionService: SessionService,
    @InjectKysely() private readonly db: KyselyDB,
    @InjectQueue(QueueName.BILLING_QUEUE) private billingQueue: Queue,
    private readonly environmentService: EnvironmentService,
    @Inject(AUDIT_SERVICE) private readonly auditService: IAuditService,
  ) {}

  async getInvitations(workspaceId: string, pagination: PaginationOptions) {
    let query = this.db
      .selectFrom("workspaceInvitations")
      .select(["id", "email", "role", "workspaceId", "createdAt"])
      .where("workspaceId", "=", workspaceId);

    if (pagination.query) {
      query = query.where((eb) =>
        eb(
          sql`email`,
          "ilike",
          sql`f_unaccent(${"%" + pagination.query + "%"})`
        )
      );
    }

    return executeWithCursorPagination(query, {
      beforeCursor: pagination.beforeCursor,
      cursor: pagination.cursor,
      fields: [{ direction: "asc", expression: "id" }],
      parseCursor: (cursor) => ({ id: cursor.id }),
      perPage: pagination.limit,
    });
  }

  async getInvitationById(invitationId: string, workspace: Workspace) {
    const invitation = await this.db
      .selectFrom("workspaceInvitations")
      .select(["id", "email", "createdAt"])
      .where("id", "=", invitationId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    return { ...invitation, enforceSso: workspace.enforceSso };
  }

  async getInvitationTokenById(invitationId: string, workspaceId: string) {
    const invitation = await this.db
      .selectFrom("workspaceInvitations")
      .select(["token"])
      .where("id", "=", invitationId)
      .where("workspaceId", "=", workspaceId)
      .executeTakeFirst();

    if (!invitation) {
      throw new NotFoundException("Invitation not found");
    }

    return invitation;
  }

  async createInvitation(
    inviteUserDto: InviteUserDto,
    workspace: Workspace,
    authUser: User
  ): Promise<void> {
    const { emails, role, groupIds } = inviteUserDto;

    if (isAdminActingOnOwner(authUser.role, role)) {
      throw new ForbiddenException();
    }

    let invites: WorkspaceInvitation[] = [];

    try {
      await executeTx(this.db, async (trx) => {
        // we do not want to invite existing members
        const findExistingUsers = await this.db
          .selectFrom("users")
          .select(["email"])
          .where("users.email", "in", emails)
          .where("users.workspaceId", "=", workspace.id)
          .execute();

        let existingUserEmails = [];
        if (findExistingUsers) {
          existingUserEmails = findExistingUsers.map((user) => user.email);
        }

        // filter out existing users
        const inviteEmails = emails.filter(
          (email) => !existingUserEmails.includes(email)
        );

        let validGroups = [];
        if (groupIds && groupIds.length > 0) {
          validGroups = await trx
            .selectFrom("groups")
            .select(["id", "name"])
            .where("groups.id", "in", groupIds)
            .where("groups.workspaceId", "=", workspace.id)
            .execute();
        }

        const invitesToInsert = inviteEmails.map((email) => ({
          email,
          groupIds: validGroups?.map((group: Partial<Group>) => group.id),
          invitedById: authUser.id,
          role,
          token: nanoIdGen(16),
          workspaceId: workspace.id,
        }));

        if (invitesToInsert.length < 1) {
          return;
        }

        invites = await trx
          .insertInto("workspaceInvitations")
          .values(invitesToInsert)
          .onConflict((oc) => oc.columns(["email", "workspaceId"]).doNothing())
          .returningAll()
          .execute();
      });
    } catch (err) {
      this.logger.error(`createInvitation - ${err}`);
      throw new BadRequestException(
        "An error occurred while processing the invitations."
      );
    }

    // do not send code to do nothing users
    if (invites) {
      invites.forEach((invitation: WorkspaceInvitation) => {
        this.sendInvitationMail(
          invitation.id,
          invitation.email,
          invitation.token,
          authUser.name,
          workspace.hostname
        );
      });

      // Audit log for each invitation created
      for (const invitation of invites) {
        this.auditService.log({
          changes: {
            after: {
              email: invitation.email,
              role: invitation.role,
            },
          },
          event: AuditEvent.WORKSPACE_INVITE_CREATED,
          metadata: {
            groupIds: invitation.groupIds,
          },
          resourceId: invitation.id,
          resourceType: AuditResource.WORKSPACE_INVITATION,
        });
      }
    }
  }

  async acceptInvitation(
    dto: AcceptInviteDto,
    workspace: Workspace
  ): Promise<{
    authToken?: string;
    requiresLogin?: boolean;
    message?: string;
  }> {
    const invitation = await this.db
      .selectFrom("workspaceInvitations")
      .selectAll()
      .where("id", "=", dto.invitationId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!invitation) {
      throw new BadRequestException("Invitation not found");
    }

    if (dto.token !== invitation.token) {
      throw new BadRequestException("Invalid invitation token");
    }

    validateSsoEnforcement(workspace);
    validateAllowedEmail(invitation.email, workspace);

    let newUser: User;

    try {
      await executeTx(this.db, async (trx) => {
        newUser = await this.userRepo.insertUser(
          {
            email: invitation.email,
            emailVerifiedAt: new Date(),
            invitedById: invitation.invitedById,
            name: dto.name,
            password: dto.password,
            role: invitation.role,
            workspaceId: workspace.id,
          },
          trx,
          { pageEditMode: getWorkspaceDefaultPageEditMode(workspace) }
        );

        // add user to default group
        await this.groupUserRepo.addUserToDefaultGroup(
          newUser.id,
          workspace.id,
          trx
        );

        if (invitation.groupIds && invitation.groupIds.length > 0) {
          // Ensure the groups are valid
          const validGroups = await trx
            .selectFrom("groups")
            .select(["id", "name"])
            .where("groups.id", "in", invitation.groupIds)
            .where("groups.workspaceId", "=", workspace.id)
            .execute();

          if (validGroups && validGroups.length > 0) {
            const groupUsersToInsert = validGroups.map((group) => ({
              groupId: group.id,
              userId: newUser.id,
            }));

            // add user to groups specified during invite
            await trx
              .insertInto("groupUsers")
              .values(groupUsersToInsert)
              .onConflict((oc) => oc.columns(["userId", "groupId"]).doNothing())
              .execute();
          }
        }

        // delete invitation record
        await trx
          .deleteFrom("workspaceInvitations")
          .where("id", "=", invitation.id)
          .execute();
      });
    } catch (err: any) {
      this.logger.error(`acceptInvitation - ${err}`);
      if (err.message.includes("unique constraint")) {
        throw new BadRequestException("Invitation already accepted");
      }
      throw new BadRequestException(
        "Failed to accept invitation. An error occurred."
      );
    }

    if (!newUser) {
      return;
    }

    // notify the inviter
    const invitedByUser = await this.userRepo.findById(
      invitation.invitedById,
      workspace.id
    );

    if (invitedByUser) {
      const emailTemplate = InvitationAcceptedEmail({
        invitedUserEmail: newUser.email,
        invitedUserName: newUser.name,
      });

      await this.mailService.sendToQueue({
        subject: `${newUser.name} has accepted your Docmost invite`,
        template: emailTemplate,
        to: invitedByUser.email,
      });
    }

    this.auditService.log({
      changes: {
        after: {
          email: newUser.email,
          name: newUser.name,
          role: invitation.role,
        },
      },
      event: AuditEvent.USER_CREATED,
      metadata: {
        invitationId: invitation.id,
        source: "invitation",
      },
      resourceId: newUser.id,
      resourceType: AuditResource.USER,
    });

    if (this.environmentService.isCloud()) {
      await this.billingQueue.add(QueueJob.STRIPE_SEATS_SYNC, {
        workspaceId: workspace.id,
      });
    }

    if (workspace.enforceMfa) {
      return {
        requiresLogin: true,
      };
    }

    const authToken = await this.sessionService.createSessionAndToken(newUser);
    return { authToken };
  }

  async resendInvitation(
    invitationId: string,
    workspace: Workspace
  ): Promise<void> {
    const invitation = await this.db
      .selectFrom("workspaceInvitations")
      .selectAll()
      .where("id", "=", invitationId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!invitation) {
      throw new BadRequestException("Invitation not found");
    }

    const invitedByUser = await this.userRepo.findById(
      invitation.invitedById,
      workspace.id
    );

    await this.sendInvitationMail(
      invitation.id,
      invitation.email,
      invitation.token,
      invitedByUser.name,
      workspace.hostname
    );

    this.auditService.log({
      event: AuditEvent.WORKSPACE_INVITE_RESENT,
      metadata: {
        email: invitation.email,
        role: invitation.role,
      },
      resourceId: invitation.id,
      resourceType: AuditResource.WORKSPACE_INVITATION,
    });
  }

  async revokeInvitation(
    invitationId: string,
    workspaceId: string
  ): Promise<void> {
    const invitation = await this.db
      .selectFrom("workspaceInvitations")
      .select(["id", "email", "role"])
      .where("id", "=", invitationId)
      .where("workspaceId", "=", workspaceId)
      .executeTakeFirst();

    await this.db
      .deleteFrom("workspaceInvitations")
      .where("id", "=", invitationId)
      .where("workspaceId", "=", workspaceId)
      .execute();

    if (invitation) {
      this.auditService.log({
        changes: {
          before: {
            email: invitation.email,
            role: invitation.role,
          },
        },
        event: AuditEvent.WORKSPACE_INVITE_REVOKED,
        resourceId: invitation.id,
        resourceType: AuditResource.WORKSPACE_INVITATION,
      });
    }
  }

  async getInvitationLinkById(
    invitationId: string,
    workspace: Workspace
  ): Promise<string> {
    const token = await this.getInvitationTokenById(invitationId, workspace.id);
    return this.buildInviteLink({
      hostname: workspace.hostname,
      invitationId,
      inviteToken: token.token,
    });
  }

  async buildInviteLink(opts: {
    invitationId: string;
    inviteToken: string;
    hostname?: string;
  }): Promise<string> {
    const { invitationId, inviteToken, hostname } = opts;
    return `${this.domainService.getUrl(hostname)}/invites/${invitationId}?token=${inviteToken}`;
  }

  async sendInvitationMail(
    invitationId: string,
    inviteeEmail: string,
    inviteToken: string,
    invitedByName: string,
    hostname?: string
  ): Promise<void> {
    const inviteLink = await this.buildInviteLink({
      hostname,
      invitationId,
      inviteToken,
    });

    const emailTemplate = InvitationEmail({
      inviteLink,
    });

    await this.mailService.sendToQueue({
      subject: `${invitedByName} invited you to Docmost`,
      template: emailTemplate,
      to: inviteeEmail,
    });
  }
}
