import { Module } from "@nestjs/common";
import { TokenModule } from "../auth/token.module";
import { TransclusionModule } from "../page/transclusion/transclusion.module";
import { ShareController } from "./share.controller";
import { ShareService } from "./share.service";
import { ShareSeoController } from "./share-seo.controller";

@Module({
  controllers: [ShareController, ShareSeoController],
  exports: [ShareService],
  imports: [TokenModule, TransclusionModule],
  providers: [ShareService],
})
export class ShareModule {}
