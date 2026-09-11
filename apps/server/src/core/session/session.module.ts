import { Global, Module } from "@nestjs/common";
import { TokenModule } from "../auth/token.module";
import { SessionController } from "./session.controller";
import { SessionService } from "./session.service";
import { SessionActivityService } from "./session-activity.service";

@Global()
@Module({
  controllers: [SessionController],
  exports: [SessionService, SessionActivityService],
  imports: [TokenModule],
  providers: [SessionService, SessionActivityService],
})
export class SessionModule {}
