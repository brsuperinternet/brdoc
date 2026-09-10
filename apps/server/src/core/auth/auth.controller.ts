import type { User, Workspace } from "@docmost/db/types/entity.types";
import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Inject,
	Logger,
	Post,
	Req,
	Res,
	UseGuards,
} from "@nestjs/common";
import type { ModuleRef } from "@nestjs/core";
import { SkipThrottle, ThrottlerGuard } from "@nestjs/throttler";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthUser } from "../../common/decorators/auth-user.decorator";
import { AuthWorkspace } from "../../common/decorators/auth-workspace.decorator";
import { AuditEvent, AuditResource } from "../../common/events/audit-events";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
	AUDIT_SERVICE,
	type IAuditService,
} from "../../integrations/audit/audit.service";
import type { EnvironmentService } from "../../integrations/environment/environment.service";
import {
	ALL_NAMED_THROTTLERS_SKIPPED,
	AUTH_THROTTLER,
} from "../../integrations/throttle/throttler-names";
import type { SessionService } from "../session/session.service";
import { validateSsoEnforcement } from "./auth.util";
import type { ChangePasswordDto } from "./dto/change-password.dto";
import type { CreateAdminUserDto } from "./dto/create-admin-user.dto";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { LoginDto } from "./dto/login.dto";
import type { PasswordResetDto } from "./dto/password-reset.dto";
import type { VerifyUserTokenDto } from "./dto/verify-user-token.dto";
import { SetupGuard } from "./guards/setup.guard";
import type { AuthService } from "./services/auth.service";

@SkipThrottle({ ...ALL_NAMED_THROTTLERS_SKIPPED, [AUTH_THROTTLER]: false })
@UseGuards(ThrottlerGuard)
@Controller("auth")
export class AuthController {
	private readonly logger = new Logger(AuthController.name);

	constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    private environmentService: EnvironmentService,
    private moduleRef: ModuleRef,
    @Inject(AUDIT_SERVICE) private readonly auditService: IAuditService,
  ) {}

	@HttpCode(HttpStatus.OK)
	@Post("login")
	async login(
		@AuthWorkspace() workspace: Workspace,
		@Res({ passthrough: true }) res: FastifyReply,
		@Body() loginInput: LoginDto,
	) {
		validateSsoEnforcement(workspace);

		let MfaModule: any;
		let isMfaModuleReady = false;
		try {
			MfaModule = require("./../../ee/mfa/services/mfa.service");
			isMfaModuleReady = true;
		} catch (err) {
			this.logger.debug(
				"MFA module requested but EE module not bundled in this build",
			);
			isMfaModuleReady = false;
		}
		if (isMfaModuleReady) {
			const mfaService = this.moduleRef.get(MfaModule.MfaService, {
				strict: false,
			});

			const mfaResult = await mfaService.checkMfaRequirements(
				loginInput,
				workspace,
				res,
			);

			if (mfaResult) {
				// If user has MFA enabled OR workspace enforces MFA, require MFA verification
				if (mfaResult.userHasMfa || mfaResult.requiresMfaSetup) {
					return {
						userHasMfa: mfaResult.userHasMfa,
						requiresMfaSetup: mfaResult.requiresMfaSetup,
						isMfaEnforced: mfaResult.isMfaEnforced,
					};
				} else if (mfaResult.authToken) {
					// User doesn't have MFA and workspace doesn't require it
					this.setAuthCookie(res, mfaResult.authToken);
					return;
				}
			}
		}

		const authToken = await this.authService.login(loginInput, workspace.id);
		this.setAuthCookie(res, authToken);
	}

	@UseGuards(SetupGuard)
	@HttpCode(HttpStatus.OK)
	@Post("setup")
	async setupWorkspace(
		@Res({ passthrough: true }) res: FastifyReply,
		@Body() createAdminUserDto: CreateAdminUserDto,
	) {
		const { workspace, authToken } =
			await this.authService.setup(createAdminUserDto);

		this.setAuthCookie(res, authToken);
		return workspace;
	}

	@SkipThrottle({ [AUTH_THROTTLER]: true })
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post("change-password")
	async changePassword(
		@Body() dto: ChangePasswordDto,
		@AuthUser() user: User,
		@AuthWorkspace() workspace: Workspace,
		@Req() req: FastifyRequest,
	) {
		const currentSessionId = (req.raw as any).sessionId;
		return this.authService.changePassword(
			dto,
			user.id,
			workspace.id,
			currentSessionId,
		);
	}

	@HttpCode(HttpStatus.OK)
	@Post("forgot-password")
	async forgotPassword(
		@Body() forgotPasswordDto: ForgotPasswordDto,
		@AuthWorkspace() workspace: Workspace,
	) {
		validateSsoEnforcement(workspace);
		return this.authService.forgotPassword(forgotPasswordDto, workspace);
	}

	@HttpCode(HttpStatus.OK)
	@Post("password-reset")
	async passwordReset(
		@Res({ passthrough: true }) res: FastifyReply,
		@Body() passwordResetDto: PasswordResetDto,
		@AuthWorkspace() workspace: Workspace,
	) {
		const result = await this.authService.passwordReset(
			passwordResetDto,
			workspace,
		);

		if (result.requiresLogin) {
			return {
				requiresLogin: true,
			};
		}

		// Set auth cookie if no MFA is required
		this.setAuthCookie(res, result.authToken);
		return {
			requiresLogin: false,
		};
	}

	@HttpCode(HttpStatus.OK)
	@Post("verify-token")
	async verifyResetToken(
		@Body() verifyUserTokenDto: VerifyUserTokenDto,
		@AuthWorkspace() workspace: Workspace,
	) {
		return this.authService.verifyUserToken(verifyUserTokenDto, workspace.id);
	}

	@SkipThrottle({ [AUTH_THROTTLER]: true })
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post("collab-token")
	async collabToken(
		@AuthUser() user: User,
		@AuthWorkspace() workspace: Workspace,
	) {
		return this.authService.getCollabToken(user, workspace.id);
	}

	@SkipThrottle({ [AUTH_THROTTLER]: true })
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@Post("logout")
	async logout(
		@AuthUser() user: User,
		@Req() req: FastifyRequest,
		@Res({ passthrough: true }) res: FastifyReply,
	) {
		const sessionId = (req.raw as any).sessionId;
		if (sessionId) {
			await this.sessionService.revokeSession(
				sessionId,
				user.id,
				user.workspaceId,
			);
		}

		res.clearCookie("authToken");

		this.auditService.log({
			event: AuditEvent.USER_LOGOUT,
			resourceType: AuditResource.USER,
			resourceId: user.id,
		});
	}

	setAuthCookie(res: FastifyReply, token: string) {
		res.setCookie("authToken", token, {
			httpOnly: true,
			sameSite: "lax",
			path: "/",
			expires: this.environmentService.getCookieExpiresIn(),
			secure: this.environmentService.isHttps(),
		});
	}
}
