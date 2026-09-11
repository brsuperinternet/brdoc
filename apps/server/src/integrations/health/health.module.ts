import { Global, Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";
import { PostgresHealthIndicator } from "./postgres.health";
import { RedisHealthIndicator } from "./redis.health";

@Global()
@Module({
  controllers: [HealthController],
  imports: [TerminusModule],
  providers: [PostgresHealthIndicator, RedisHealthIndicator],
})
export class HealthModule {}
