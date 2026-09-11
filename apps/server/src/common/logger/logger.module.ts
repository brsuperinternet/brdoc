import { Module } from "@nestjs/common";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { createPinoConfig } from "./pino.config";

@Module({
  exports: [PinoLoggerModule],
  imports: [PinoLoggerModule.forRoot(createPinoConfig())],
})
export class LoggerModule {}
