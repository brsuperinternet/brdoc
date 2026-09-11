import { Module } from "@nestjs/common";
import { PageModule } from "../../core/page/page.module";
import { StorageModule } from "../storage/storage.module";
import { FileTaskController } from "./file-task.controller";
import { ImportController } from "./import.controller";
import { FileTaskProcessor } from "./processors/file-task.processor";
import { FileImportTaskService } from "./services/file-import-task.service";
import { ImportService } from "./services/import.service";
import { ImportAttachmentService } from "./services/import-attachment.service";

@Module({
  controllers: [ImportController, FileTaskController],
  exports: [ImportService, ImportAttachmentService],
  imports: [StorageModule, PageModule],
  providers: [
    ImportService,
    FileImportTaskService,
    FileTaskProcessor,
    ImportAttachmentService,
  ],
})
export class ImportModule {}
