import { Module } from "@nestjs/common";
import { NotificationController } from "./notification.controller";
import { NotificationProcessor } from "./notification.processor";
import { NotificationService } from "./notification.service";
import { CommentNotificationService } from "./services/comment.notification";
import { PageNotificationService } from "./services/page.notification";
import { PageUpdateEmailRateLimiter } from "./services/page-update-email-rate-limiter";
import { VerificationNotificationService } from "./services/verification.notification";

@Module({
  controllers: [NotificationController],
  exports: [NotificationService],
  imports: [],
  providers: [
    NotificationService,
    NotificationProcessor,
    CommentNotificationService,
    PageNotificationService,
    VerificationNotificationService,
    PageUpdateEmailRateLimiter,
  ],
})
export class NotificationModule {}
