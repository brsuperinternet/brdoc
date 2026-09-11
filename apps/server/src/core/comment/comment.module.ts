import { Module } from "@nestjs/common";
import { CollaborationModule } from "../../collaboration/collaboration.module";
import { CommentController } from "./comment.controller";
import { CommentService } from "./comment.service";

@Module({
  controllers: [CommentController],
  exports: [CommentService],
  imports: [CollaborationModule],
  providers: [CommentService],
})
export class CommentModule {}
