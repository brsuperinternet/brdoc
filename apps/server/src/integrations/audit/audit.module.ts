import { Global, Module } from "@nestjs/common";
import { AUDIT_SERVICE, NoopAuditService } from "./audit.service";

@Global()
@Module({
  exports: [AUDIT_SERVICE],
  providers: [
    {
      provide: AUDIT_SERVICE,
      useClass: NoopAuditService,
    },
  ],
})
export class NoopAuditModule {}
