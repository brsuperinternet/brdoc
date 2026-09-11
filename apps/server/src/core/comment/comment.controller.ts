import { PaginationOptions } from "@docmost/db/pagination/pagination-options";
import { CommentRepo } from "@docmost/db/repos/comment/comment.repo";
import { PageRepo } from "@docmost/db/repos/page/page.repo";
import { User, Workspace } from "@docmost/db/types/entity.types";
import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthUser } from "../../common/decorators/auth-user.decorator";
import { AuthWorkspace } from "../../common/decorators/auth-workspace.decorator";
import { OAuthScope } from "../../common/decorators/oauth-scope.decorator";
import { AuditEvent, AuditResource } from "../../common/events/audit-events";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  AUDIT_SERVICE,
  IAuditService,
} from "../../integrations/audit/audit.service";
import { WsService } from "../../ws/ws.service";
import SpaceAbilityFactory from "../casl/abilities/space-ability.factory";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "../casl/interfaces/space-ability.type";
import { PageAccessService } from "../page/page-access/page-access.service";
import { CommentService } from "./comment.service";
import { CommentIdDto, PageIdDto } from "./dto/comments.input";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

@UseGuards(JwtAuthGuard)
@Controller("comments")
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly commentRepo: CommentRepo,
    private readonly pageRepo: PageRepo,
    private readonly spaceAbility: SpaceAbilityFactory,
    private readonly pageAccessService: PageAccessService,
    private readonly wsService: WsService,
    @Inject(AUDIT_SERVICE) private readonly auditService: IAuditService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post("create")
  @OAuthScope("write")
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const page = await this.pageRepo.findById(createCommentDto.pageId);
    if (!page || page.workspaceId !== workspace.id || page.deletedAt) {
      throw new NotFoundException("Page not found");
    }

    await this.pageAccessService.validateCanComment(page, user, workspace.id);

    const comment = await this.commentService.create(
      {
        page,
        user,
        workspaceId: workspace.id,
      },
      createCommentDto
    );

    this.auditService.log({
      event: AuditEvent.COMMENT_CREATED,
      metadata: {
        pageId: page.id,
      },
      resourceId: comment.id,
      resourceType: AuditResource.COMMENT,
      spaceId: page.spaceId,
    });

    return comment;
  }

  @HttpCode(HttpStatus.OK)
  @Post("/")
  @OAuthScope("read")
  async findPageComments(
    @Body() input: PageIdDto,
    @Body()
    pagination: PaginationOptions,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const page = await this.pageRepo.findById(input.pageId);
    if (!page || page.workspaceId !== workspace.id || page.deletedAt) {
      throw new NotFoundException("Page not found");
    }

    await this.pageAccessService.validateCanView(page, user);

    return this.commentService.findByPageId(page.id, pagination);
  }

  @HttpCode(HttpStatus.OK)
  @Post("info")
  async findOne(
    @Body() input: CommentIdDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const comment = await this.commentRepo.findById(input.commentId);
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    const page = await this.pageRepo.findById(comment.pageId);
    if (!page || page.workspaceId !== workspace.id || page.deletedAt) {
      throw new NotFoundException("Page not found");
    }

    await this.pageAccessService.validateCanView(page, user);

    return comment;
  }

  @HttpCode(HttpStatus.OK)
  @Post("update")
  @OAuthScope("write")
  async update(
    @Body() dto: UpdateCommentDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const comment = await this.commentRepo.findById(dto.commentId, {
      includeCreator: true,
      includeResolvedBy: true,
    });
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    const page = await this.pageRepo.findById(comment.pageId);
    if (!page || page.workspaceId !== workspace.id || page.deletedAt) {
      throw new NotFoundException("Page not found");
    }

    await this.pageAccessService.validateCanComment(page, user, workspace.id);

    return this.commentService.update(comment, dto, user);
  }

  @HttpCode(HttpStatus.OK)
  @Post("delete")
  async delete(
    @Body() input: CommentIdDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const comment = await this.commentRepo.findById(input.commentId);
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }

    const page = await this.pageRepo.findById(comment.pageId);
    if (!page || page.workspaceId !== workspace.id || page.deletedAt) {
      throw new NotFoundException("Page not found");
    }

    await this.pageAccessService.validateCanComment(page, user, workspace.id);

    // Check if user is the comment owner
    const isOwner = comment.creatorId === user.id;

    if (isOwner) {
      await this.commentRepo.deleteComment(comment.id);
    } else {
      const ability = await this.spaceAbility.createForUser(
        user,
        comment.spaceId
      );

      // Space admin can delete any comment
      if (ability.cannot(SpaceCaslAction.Manage, SpaceCaslSubject.Settings)) {
        throw new ForbiddenException("You can only delete your own comments");
      }
      await this.commentRepo.deleteComment(comment.id);
    }

    this.wsService.emitCommentEvent(comment.spaceId, comment.pageId, {
      commentId: comment.id,
      operation: "commentDeleted",
      pageId: comment.pageId,
    });

    this.auditService.log({
      changes: {
        before: {
          creatorId: comment.creatorId,
          pageId: comment.pageId,
        },
      },
      event: AuditEvent.COMMENT_DELETED,
      resourceId: comment.id,
      resourceType: AuditResource.COMMENT,
      spaceId: comment.spaceId,
    });
  }
}
