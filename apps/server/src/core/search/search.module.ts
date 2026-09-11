import { Module } from "@nestjs/common";
import { PublicSpaceModule } from "../public-space/public-space.module";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";

@Module({
  controllers: [SearchController],
  exports: [SearchService],
  imports: [PublicSpaceModule],
  providers: [SearchService],
})
export class SearchModule {}
