import { CursorPaginationResult } from "@docmost/db/pagination/cursor-pagination";
import { PaginationOptions } from "@docmost/db/pagination/pagination-options";
import { CommentRepo } from "@docmost/db/repos/comment/comment.repo";
import { PageRepo } from "@docmost/db/repos/page/page.repo";
import { Comment, Page, User } from "@docmost/db/types/entity.types";
import { InjectQueue } from "@nestjs/bullmq";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Queue } from "bullmq";
import { CollaborationGateway } from "../../collaboration/collaboration.gateway";
import { extractUserMentionIdsFromJson } from "../../common/helpers/prosemirror/utils";
import { QueueJob, QueueName } from "../../integrations/queue/constants";
import { ICommentNotificationJob } from "../../integrations/queue/constants/queue.interface";
import { WsService } from "../../ws/ws.service";
import { CreateCommentDto, yjsSelectionSchema } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    private commentRepo: CommentRepo,
    private pageRepo: PageRepo,
    private wsService: WsService,
    private collaborationGateway: CollaborationGateway,
    @InjectQueue(QueueName.GENERAL_QUEUE)
    private generalQueue: Queue,
    @InjectQueue(QueueName.NOTIFICATION_QUEUE)
    private notificationQueue: Queue,
  ) {}

  async findById(commentId: string) {
    const comment = await this.commentRepo.findById(commentId, {
      includeCreator: true,
      includeResolvedBy: true,
    });
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }
    return comment;
  }

  async create(
    opts: { page: Page; workspaceId: string; user: User },
    createCommentDto: CreateCommentDto
  ) {
    const { page, workspaceId, user } = opts;
    const commentContent = JSON.parse(createCommentDto.content);

    if (createCommentDto.parentCommentId) {
      const parentComment = await this.commentRepo.findById(
        createCommentDto.parentCommentId
      );

      if (!parentComment || parentComment.pageId !== page.id) {
        throw new BadRequestException("Parent comment not found");
      }

      if (parentComment.parentCommentId !== null) {
        throw new BadRequestException("You cannot reply to a reply");
      }
    }

    const inserted = await this.commentRepo.insertComment({
      content: commentContent,
      creatorId: user.id,
      pageId: page.id,
      parentCommentId: createCommentDto?.parentCommentId,
      selection: createCommentDto?.selection?.substring(0, 250) ?? null,
      spaceId: page.spaceId,
      type: createCommentDto.type ?? "page",
      workspaceId,
    });

    if (createCommentDto.yjsSelection) {
      const parsed = yjsSelectionSchema.safeParse(
        createCommentDto.yjsSelection
      );
      if (parsed.success) {
        const documentName = `page.${page.id}`;
        try {
          await this.collaborationGateway.handleYjsEvent(
            "setCommentMark",
            documentName,
            {
              commentId: inserted.id,
              resolved: false,
              user,
              yjsSelection: parsed.data,
            }
          );
        } catch (error) {
          this.logger.warn(
            `Failed to apply comment mark for comment ${inserted.id}, comment saved without inline highlight`,
            error
          );
        }
      } else {
        this.logger.warn(
          `Invalid yjsSelection for comment ${inserted.id}: ${parsed.error.message}`
        );
      }
    }

    const comment = await this.commentRepo.findById(inserted.id, {
      includeCreator: true,
      includeResolvedBy: true,
    });

    this.generalQueue
      .add(QueueJob.ADD_PAGE_WATCHERS, {
        pageId: page.id,
        spaceId: page.spaceId,
        userIds: [user.id],
        workspaceId,
      })
      .catch((err) =>
        this.logger.warn(`Failed to queue add-page-watchers: ${err.message}`)
      );

    const isReply = !!createCommentDto.parentCommentId;

    await this.queueCommentNotification(
      commentContent,
      [],
      comment.id,
      page.id,
      page.spaceId,
      workspaceId,
      user.id,
      !isReply,
      createCommentDto.parentCommentId
    );

    this.wsService.emitCommentEvent(page.spaceId, page.id, {
      comment,
      operation: "commentCreated",
      pageId: page.id,
    });

    return comment;
  }

  async findByPageId(
    pageId: string,
    pagination: PaginationOptions
  ): Promise<CursorPaginationResult<Comment>> {
    const page = await this.pageRepo.findById(pageId);

    if (!page) {
      throw new BadRequestException("Page not found");
    }

    return this.commentRepo.findPageComments(pageId, pagination);
  }

  async update(
    comment: Comment,
    updateCommentDto: UpdateCommentDto,
    authUser: User
  ): Promise<Comment> {
    const commentContent = JSON.parse(updateCommentDto.content);

    if (comment.creatorId !== authUser.id) {
      throw new ForbiddenException("You can only edit your own comments");
    }

    const oldMentionIds = extractUserMentionIdsFromJson(comment.content);

    const editedAt = new Date();

    await this.commentRepo.updateComment(
      {
        content: commentContent,
        editedAt,
        updatedAt: editedAt,
      },
      comment.id
    );

    await this.queueCommentNotification(
      commentContent,
      oldMentionIds,
      comment.id,
      comment.pageId,
      comment.spaceId,
      comment.workspaceId,
      authUser.id,
      false
    );

    comment.content = commentContent;
    comment.editedAt = editedAt;
    comment.updatedAt = editedAt;

    this.wsService.emitCommentEvent(comment.spaceId, comment.pageId, {
      comment,
      operation: "commentUpdated",
      pageId: comment.pageId,
    });

    return comment;
  }

  private async queueCommentNotification(
    content: any,
    oldMentionIds: string[],
    commentId: string,
    pageId: string,
    spaceId: string,
    workspaceId: string,
    actorId: string,
    notifyWatchers: boolean,
    parentCommentId?: string
  ) {
    const mentionedUserIds = extractUserMentionIdsFromJson(content);
    const newMentionIds = mentionedUserIds.filter(
      (id) => id !== actorId && !oldMentionIds.includes(id)
    );

    if (newMentionIds.length === 0 && !notifyWatchers && !parentCommentId) {
      return;
    }

    const jobData: ICommentNotificationJob = {
      actorId,
      commentId,
      mentionedUserIds: newMentionIds,
      notifyWatchers,
      pageId,
      parentCommentId,
      spaceId,
      workspaceId,
    };

    await this.notificationQueue.add(QueueJob.COMMENT_NOTIFICATION, jobData);
  }
}
