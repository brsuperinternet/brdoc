import { Module } from "@nestjs/common";
import { WorkspaceModule } from "../workspace/workspace.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./services/auth.service";
import { SignupService } from "./services/signup.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { TokenModule } from "./token.module";

@Module({
  controllers: [AuthController],
  exports: [SignupService],
  imports: [TokenModule, WorkspaceModule],
  providers: [AuthService, SignupService, JwtStrategy],
})
export class AuthModule {}
