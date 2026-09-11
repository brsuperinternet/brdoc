import { Module } from "@nestjs/common";
import { PageAccessModule } from "../page/page-access/page-access.module";
import { SpaceWatcherController } from "./space-watcher.controller";
import { WatcherController } from "./watcher.controller";
import { WatcherService } from "./watcher.service";

@Module({
  controllers: [WatcherController, SpaceWatcherController],
  exports: [WatcherService],
  imports: [PageAccessModule],
  providers: [WatcherService],
})
export class WatcherModule {}
