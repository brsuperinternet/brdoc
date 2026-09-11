import { Module } from "@nestjs/common";
import { TransclusionModule } from "../page/transclusion/transclusion.module";
import { ShareModule } from "../share/share.module";
import { PublicSpaceController } from "./public-space.controller";
import { PublicSpaceService } from "./public-space.service";
import { PublicSpaceSeoController } from "./public-space-seo.controller";

@Module({
  controllers: [PublicSpaceController, PublicSpaceSeoController],
  exports: [PublicSpaceService],
  imports: [ShareModule, TransclusionModule],
  providers: [PublicSpaceService],
})
export class PublicSpaceModule {}
