import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import Redis from "ioredis";
import { createRetryStrategy, parseRedisUrl } from "../../common/helpers";
import { EnvironmentModule } from "../environment/environment.module";
import { EnvironmentService } from "../environment/environment.service";
import {
  AI_CHAT_THROTTLER,
  AUTH_THROTTLER,
  OAUTH_AUTHORIZE_THROTTLER,
  OAUTH_REGISTER_THROTTLER,
  OAUTH_TOKEN_THROTTLER,
  SIEM_TEST_THROTTLER,
} from "./throttler-names";

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [EnvironmentModule],
      inject: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => {
        const redisConfig = parseRedisUrl(environmentService.getRedisUrl());

        return {
          errorMessage: "Too many requests",
          storage: new ThrottlerStorageRedisService(
            new Redis({
              db: redisConfig.db,
              family: redisConfig.family,
              host: redisConfig.host,
              keyPrefix: "throttle:",
              password: redisConfig.password,
              port: redisConfig.port,
              retryStrategy: createRetryStrategy(),
              tls: redisConfig.tls,
              username: redisConfig.username,
            })
          ),
          throttlers: [
            { limit: 10, name: AUTH_THROTTLER, ttl: 60_000 },
            { limit: 25, name: AI_CHAT_THROTTLER, ttl: 60_000 },
            { limit: 10, name: OAUTH_REGISTER_THROTTLER, ttl: 3_600_000 },
            { limit: 60, name: OAUTH_TOKEN_THROTTLER, ttl: 60_000 },
            { limit: 30, name: OAUTH_AUTHORIZE_THROTTLER, ttl: 60_000 },
            { limit: 10, name: SIEM_TEST_THROTTLER, ttl: 60_000 },
          ],
        };
      },
    }),
  ],
})
export class ThrottleModule {}
