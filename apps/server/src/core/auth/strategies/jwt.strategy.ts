import { UserSessionRepo } from "@docmost/db/repos/session/user-session.repo";
import { UserRepo } from "@docmost/db/repos/user/user.repo";
import { WorkspaceRepo } from "@docmost/db/repos/workspace/workspace.repo";
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { PassportStrategy } from "@nestjs/passport";
import { FastifyRequest } from "fastify";
import { Strategy } from "passport-jwt";
import {
  extractBearerTokenFromHeader,
  isUserDisabled,
} from "../../../common/helpers";
import { EnvironmentService } from "../../../integrations/environment/environment.service";
import { SessionActivityService } from "../../session/session-activity.service";
import {
  JwtApiKeyPayload,
  JwtOAuthPayload,
  JwtPayload,
  JwtType,
} from "../dto/jwt-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  private logger = new Logger("JwtStrategy");

  constructor(
    private userRepo: UserRepo,
    private workspaceRepo: WorkspaceRepo,
    private userSessionRepo: UserSessionRepo,
    private sessionActivityService: SessionActivityService,
    private readonly environmentService: EnvironmentService,
    private moduleRef: ModuleRef
  ) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: (req: FastifyRequest) =>
        req.cookies?.authToken || extractBearerTokenFromHeader(req),
      passReqToCallback: true,
      secretOrKey: environmentService.getAppSecret(),
    });
  }

  async validate(
    req: any,
    payload: JwtPayload | JwtApiKeyPayload | JwtOAuthPayload
  ) {
    if (!payload.workspaceId) {
      throw new UnauthorizedException();
    }

    if (req.raw.workspaceId && req.raw.workspaceId !== payload.workspaceId) {
      throw new UnauthorizedException("Workspace does not match");
    }

    // authType lets guards tell an interactive session from a programmatic credential.
    if (payload.type === JwtType.API_KEY) {
      const authResult = await this.validateApiKey(
        req,
        payload as JwtApiKeyPayload
      );
      return { ...authResult, authType: JwtType.API_KEY };
    }

    if (payload.type === JwtType.OAUTH_ACCESS) {
      const authResult = await this.validateOAuthToken(
        req,
        payload as JwtOAuthPayload
      );
      return { ...authResult, authType: JwtType.OAUTH_ACCESS };
    }

    if (payload.type !== JwtType.ACCESS) {
      throw new UnauthorizedException();
    }

    const workspace = await this.workspaceRepo.findById(payload.workspaceId);

    if (!workspace) {
      throw new UnauthorizedException();
    }
    const user = await this.userRepo.findById(payload.sub, payload.workspaceId);

    if (!user || isUserDisabled(user)) {
      throw new UnauthorizedException();
    }

    if ((payload as JwtPayload).sessionId) {
      const sessionId = (payload as JwtPayload).sessionId;
      const session = await this.userSessionRepo.findActiveById(sessionId);
      if (
        !session ||
        session.userId !== payload.sub ||
        session.workspaceId !== payload.workspaceId
      ) {
        throw new UnauthorizedException();
      }
      req.raw.sessionId = sessionId;
      this.sessionActivityService.trackActivity(
        sessionId,
        payload.sub,
        payload.workspaceId
      );
    }

    return { authType: JwtType.ACCESS, user, workspace };
  }

  private async validateApiKey(req: any, payload: JwtApiKeyPayload) {
    let ApiKeyModule: any;
    let isApiKeyModuleReady = false;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ApiKeyModule = require("./../../../ee/api-key/api-key.service");
      isApiKeyModuleReady = true;
    } catch (err) {
      this.logger.debug(
        "API Key module requested but enterprise module not bundled in this build"
      );
      isApiKeyModuleReady = false;
    }

    if (isApiKeyModuleReady) {
      const ApiKeyService = this.moduleRef.get(ApiKeyModule.ApiKeyService, {
        strict: false,
      });

      return ApiKeyService.validateApiKey(payload);
    }

    throw new UnauthorizedException("Enterprise API Key module missing");
  }

  private async validateOAuthToken(req: any, payload: JwtOAuthPayload) {
    let OAuthStrategyModule: any;
    let isOAuthModuleReady = false;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      OAuthStrategyModule = require("./../../../ee/oauth/services/oauth-strategy.service");
      isOAuthModuleReady = true;
    } catch (err) {
      this.logger.debug(
        "OAuth module requested but enterprise module not bundled in this build"
      );
      isOAuthModuleReady = false;
    }

    if (isOAuthModuleReady) {
      const OAuthStrategyService = this.moduleRef.get(
        OAuthStrategyModule.OAuthStrategyService,
        {
          strict: false,
        }
      );

      return OAuthStrategyService.validateOAuthToken(payload, {
        host: req.raw.headers?.host ?? req.headers?.host,
        workspaceId: req.raw.workspaceId,
      });
    }

    throw new UnauthorizedException("Enterprise OAuth module missing");
  }
}
