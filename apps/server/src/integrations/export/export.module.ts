import { Module } from "@nestjs/common";
import { StorageModule } from "../storage/storage.module";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";

@Module({
  controllers: [ExportController],
  imports: [StorageModule],
  providers: [ExportService],
})
export class ExportModule {}
