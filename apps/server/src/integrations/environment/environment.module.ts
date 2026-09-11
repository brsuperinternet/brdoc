import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { envPath } from "../../common/helpers";
import { DomainService } from "./domain.service";
import { EnvironmentService } from "./environment.service";
import { validate } from "./environment.validation";
import { LicenseCheckService } from "./license-check.service";

@Global()
@Module({
  exports: [EnvironmentService, DomainService, LicenseCheckService],
  imports: [
    ConfigModule.forRoot({
      envFilePath: envPath,
      expandVariables: true,
      isGlobal: true,
      validate,
    }),
  ],
  providers: [EnvironmentService, DomainService, LicenseCheckService],
})
export class EnvironmentModule {}
