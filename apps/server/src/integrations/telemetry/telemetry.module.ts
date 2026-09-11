import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TelemetryService } from "./telemetry.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TelemetryService],
})
export class TelemetryModule {}
