import { BullModule } from "@nestjs/bullmq";
import { Global, Module } from "@nestjs/common";
import { createRetryStrategy, parseRedisUrl } from "../../common/helpers";
import { EnvironmentService } from "../environment/environment.service";
import { QueueName } from "./constants";
import { GeneralQueueProcessor } from "./processors/general-queue.processor";

@Global()
@Module({
  exports: [BullModule],
  imports: [
    BullModule.forRootAsync({
      inject: [EnvironmentService],
      useFactory: (environmentService: EnvironmentService) => {
        const redisConfig = parseRedisUrl(environmentService.getRedisUrl());
        return {
          connection: {
            db: redisConfig.db,
            family: redisConfig.family,
            host: redisConfig.host,
            password: redisConfig.password,
            port: redisConfig.port,
            retryStrategy: createRetryStrategy(),
            tls: redisConfig.tls,
            username: redisConfig.username,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              delay: 20 * 1000,
              type: "exponential",
            },
            removeOnComplete: {
              count: 200,
            },
            removeOnFail: {
              count: 100,
            },
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: QueueName.EMAIL_QUEUE,
    }),
    BullModule.registerQueue({
      name: QueueName.ATTACHMENT_QUEUE,
    }),
    BullModule.registerQueue({
      name: QueueName.GENERAL_QUEUE,
    }),
    BullModule.registerQueue({
      name: QueueName.BILLING_QUEUE,
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
      },
      name: QueueName.FILE_TASK_QUEUE,
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: true,
      },
      name: QueueName.SEARCH_QUEUE,
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
      },
      name: QueueName.AI_QUEUE,
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: true,
      },
      name: QueueName.HISTORY_QUEUE,
    }),
    BullModule.registerQueue({
      name: QueueName.NOTIFICATION_QUEUE,
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: true,
      },
      name: QueueName.AUDIT_QUEUE,
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
      },
      name: QueueName.SIEM_QUEUE,
    }),
    BullModule.registerQueue({
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 100 },
      },
      name: QueueName.BASE_QUEUE,
    }),
  ],
  providers: [GeneralQueueProcessor],
})
export class QueueModule {}
