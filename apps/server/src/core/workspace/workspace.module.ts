import { Module } from "@nestjs/common";
import { TokenModule } from "../auth/token.module";
import { SpaceModule } from "../space/space.module";
import { WorkspaceController } from "./controllers/workspace.controller";
import { WorkspaceService } from "./services/workspace.service";
import { WorkspaceInvitationService } from "./services/workspace-invitation.service";

@Module({
  controllers: [WorkspaceController],
  exports: [WorkspaceService],
  imports: [SpaceModule, TokenModule],
  providers: [WorkspaceService, WorkspaceInvitationService],
})
export class WorkspaceModule {}
