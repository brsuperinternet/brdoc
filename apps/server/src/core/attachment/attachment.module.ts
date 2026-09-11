import { Module } from "@nestjs/common";
import { StorageModule } from "../../integrations/storage/storage.module";
import { TokenModule } from "../auth/token.module";
import { UserModule } from "../user/user.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { AttachmentController } from "./attachment.controller";
import { AttachmentProcessor } from "./processors/attachment.processor";
import { AttachmentService } from "./services/attachment.service";

@Module({
  controllers: [AttachmentController],
  imports: [StorageModule, UserModule, WorkspaceModule, TokenModule],
  providers: [AttachmentService, AttachmentProcessor],
})
export class AttachmentModule {}
