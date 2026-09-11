import { Injectable } from "@nestjs/common";
import {
  RedisModuleOptions,
  RedisOptionsFactory,
} from "@nestjs-labs/nestjs-ioredis";
import { createRetryStrategy, parseRedisUrl } from "../../common/helpers";
import { EnvironmentService } from "../environment/environment.service";

@Injectable()
export class RedisConfigService implements RedisOptionsFactory {
  constructor(private readonly environmentService: EnvironmentService) {}
  createRedisOptions(): RedisModuleOptions {
    const redisConfig = parseRedisUrl(this.environmentService.getRedisUrl());
    return {
      config: {
        db: redisConfig.db,
        family: redisConfig.family,
        host: redisConfig.host,
        password: redisConfig.password,
        port: redisConfig.port,
        retryStrategy: createRetryStrategy(),
        tls: redisConfig.tls,
        username: redisConfig.username,
      },
      readyLog: true,
    };
  }
}
