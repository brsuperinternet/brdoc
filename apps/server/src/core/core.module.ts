import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { AuditContextMiddleware } from "../common/middlewares/audit-context.middleware";
import { DomainMiddleware } from "../common/middlewares/domain.middleware";
import { AttachmentModule } from "./attachment/attachment.module";
import { AuthModule } from "./auth/auth.module";
import { CaslModule } from "./casl/casl.module";
import { CommentModule } from "./comment/comment.module";
import { FavoriteModule } from "./favorite/favorite.module";
import { GroupModule } from "./group/group.module";
import { LabelModule } from "./label/label.module";
import { NotificationModule } from "./notification/notification.module";
import { PageModule } from "./page/page.module";
import { PageAccessModule } from "./page/page-access/page-access.module";
import { PublicSpaceModule } from "./public-space/public-space.module";
import { SearchModule } from "./search/search.module";
import { SessionModule } from "./session/session.module";
import { ShareModule } from "./share/share.module";
import { SpaceModule } from "./space/space.module";
import { UserModule } from "./user/user.module";
import { WatcherModule } from "./watcher/watcher.module";
import { WorkspaceModule } from "./workspace/workspace.module";

@Module({
  imports: [
    UserModule,
    AuthModule,
    WorkspaceModule,
    PageModule,
    AttachmentModule,
    CommentModule,
    FavoriteModule,
    SearchModule,
    SpaceModule,
    GroupModule,
    CaslModule,
    PageAccessModule,
    ShareModule,
    PublicSpaceModule,
    LabelModule,
    NotificationModule,
    WatcherModule,
    SessionModule,
  ],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const excludedRoutes = [
      { method: RequestMethod.POST, path: "auth/setup" },
      { method: RequestMethod.GET, path: "health" },
      { method: RequestMethod.GET, path: "health/live" },
      { method: RequestMethod.POST, path: "billing/stripe/webhook" },
    ];

    consumer
      .apply(DomainMiddleware)
      .exclude(...excludedRoutes)
      .forRoutes("*");

    consumer
      .apply(AuditContextMiddleware)
      .exclude(...excludedRoutes)
      .forRoutes("*");
  }
}
