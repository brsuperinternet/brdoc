import { Global, Module } from "@nestjs/common";
import { PageAccessService } from "./page-access.service";

@Global()
@Module({
  exports: [PageAccessService],
  providers: [PageAccessService],
})
export class PageAccessModule {}
