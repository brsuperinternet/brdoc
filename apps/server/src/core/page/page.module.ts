import { Module } from "@nestjs/common";
import { CollaborationModule } from "../../collaboration/collaboration.module";
import { StorageModule } from "../../integrations/storage/storage.module";
import { LabelModule } from "../label/label.module";
import { WatcherModule } from "../watcher/watcher.module";
import { PageController } from "./page.controller";
import { BacklinkService } from "./services/backlink.service";
import { PageService } from "./services/page.service";
import { PageHistoryService } from "./services/page-history.service";
import { TrashCleanupService } from "./services/trash-cleanup.service";
import { TransclusionModule } from "./transclusion/transclusion.module";

@Module({
  controllers: [PageController],
  exports: [PageService, PageHistoryService],
  imports: [
    StorageModule,
    CollaborationModule,
    WatcherModule,
    TransclusionModule,
    LabelModule,
  ],
  providers: [
    PageService,
    PageHistoryService,
    TrashCleanupService,
    BacklinkService,
  ],
})
export class PageModule {}
