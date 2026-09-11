import { Module } from "@nestjs/common";
import { LabelController } from "./label.controller";
import { LabelService } from "./label.service";

@Module({
  controllers: [LabelController],
  exports: [LabelService],
  providers: [LabelService],
})
export class LabelModule {}
