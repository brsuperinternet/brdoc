import { UserSessionRepo } from "@docmost/db/repos/session/user-session.repo";
import { User } from "@docmost/db/types/entity.types";
import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import * as Bowser from "bowser";
import { ClsService } from "nestjs-cls";
import {
  AUDIT_CONTEXT_KEY,
  AuditContext,
} from "../../common/middlewares/audit-context.middleware";
import { EnvironmentService } from "../../integrations/environment/environment.service";
import { TokenService } from "../auth/services/token.service";

const MAX_SESSIONS_PER_USER = 25;
const RETENTION_DAYS = 7;

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly userSessionRepo: UserSessionRepo,
    private readonly environmentService: EnvironmentService,
    private readonly cls: ClsService
  ) {}

  @Interval("session-cleanup", 24 * 60 * 60 * 1000)
  async cleanupSessions() {
    try {
      await this.userSessionRepo.deleteStale(RETENTION_DAYS);
      await this.userSessionRepo.trimExcessSessions(MAX_SESSIONS_PER_USER);
      this.logger.debug("Session cleanup completed");
    } catch (err) {
      this.logger.error("Session cleanup failed", err);
    }
  }

  async createSessionAndToken(user: User): Promise<string> {
    const auditContext = this.cls.get<AuditContext>(AUDIT_CONTEXT_KEY);
    const ipAddress = auditContext?.ipAddress ?? null;
    const userAgent = auditContext?.userAgent ?? null;

    const deviceName = this.parseDeviceName(userAgent);
    const expiresAt = this.environmentService.getCookieExpiresIn();

    const session = await this.userSessionRepo.insertSession({
      deviceName,
      expiresAt,
      ipAddress,
      userId: user.id,
      workspaceId: user.workspaceId,
    });

    return this.tokenService.generateAccessToken(user, session.id);
  }

  async getActiveSessions(
    userId: string,
    workspaceId: string,
    currentSessionId: string | null
  ) {
    const sessions = await this.userSessionRepo.findActiveByUser(
      userId,
      workspaceId
    );

    const mapped = sessions.map((s) => ({
      createdAt: s.createdAt,
      deviceName: s.deviceName,
      geoLocation: s.geoLocation,
      id: s.id,
      isCurrentDevice: s.id === currentSessionId,
      lastActiveAt: s.lastActiveAt,
    }));

    return mapped.sort((a, b) => {
      if (a.isCurrentDevice) {
        return -1;
      }
      if (b.isCurrentDevice) {
        return 1;
      }
      return 0;
    });
  }

  async revokeSession(
    sessionId: string,
    userId: string,
    workspaceId: string
  ): Promise<void> {
    await this.userSessionRepo.revokeById(sessionId, userId, workspaceId);
  }

  async revokeAllOtherSessions(
    currentSessionId: string,
    userId: string,
    workspaceId: string
  ): Promise<void> {
    await this.userSessionRepo.revokeAllExceptCurrent(
      currentSessionId,
      userId,
      workspaceId
    );
  }

  private parseDeviceName(userAgent: string | null): string | null {
    if (!userAgent) {
      return null;
    }

    try {
      const parsed = Bowser.parse(userAgent);

      const os = parsed.os?.name;
      const browser = parsed.browser?.name;
      const platformType = parsed.platform?.type;

      if (platformType === "mobile" || platformType === "tablet") {
        return parsed.platform?.model || os || "Mobile Device";
      }

      if (os) {
        return browser ? `${browser} on ${os}` : os;
      }

      return browser || null;
    } catch {
      return null;
    }
  }
}
