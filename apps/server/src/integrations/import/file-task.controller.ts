import { executeWithCursorPagination } from "@docmost/db/pagination/cursor-pagination";
import { PaginationOptions } from "@docmost/db/pagination/pagination-options";
import { SpaceMemberRepo } from "@docmost/db/repos/space/space-member.repo";
import { User, Workspace } from "@docmost/db/types/entity.types";
import { KyselyDB } from "@docmost/db/types/kysely.types";
import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from "@nestjs/common";
import { InjectKysely } from "nestjs-kysely";
import { AuthUser } from "../../common/decorators/auth-user.decorator";
import { AuthWorkspace } from "../../common/decorators/auth-workspace.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import SpaceAbilityFactory from "../../core/casl/abilities/space-ability.factory";
import WorkspaceAbilityFactory from "../../core/casl/abilities/workspace-ability.factory";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "../../core/casl/interfaces/space-ability.type";
import {
  WorkspaceCaslAction,
  WorkspaceCaslSubject,
} from "../../core/casl/interfaces/workspace-ability.type";
import { FileTaskIdDto } from "./dto/file-task-dto";

@Controller("file-tasks")
export class FileTaskController {
  constructor(
    private readonly spaceAbility: SpaceAbilityFactory,
    private readonly workspaceAbility: WorkspaceAbilityFactory,
    private readonly spaceMemberRepo: SpaceMemberRepo,
    @InjectKysely() private readonly db: KyselyDB,
  ) {}

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post()
  async getFileTasks(
    @Body() pagination: PaginationOptions,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const ability = this.workspaceAbility.createForUser(user, workspace);
    if (
      ability.cannot(WorkspaceCaslAction.Manage, WorkspaceCaslSubject.Settings)
    ) {
      throw new ForbiddenException();
    }

    const query = this.db
      .selectFrom("fileTasks")
      .selectAll()
      .where(
        "spaceId",
        "in",
        this.spaceMemberRepo.getUserSpaceIdsQuery(user.id)
      );

    return executeWithCursorPagination(query, {
      beforeCursor: pagination.beforeCursor,
      cursor: pagination.cursor,
      fields: [{ direction: "desc", expression: "id" }],
      parseCursor: (cursor) => ({ id: cursor.id }),
      perPage: pagination.limit,
    });
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post("info")
  async getFileTask(@Body() dto: FileTaskIdDto, @AuthUser() user: User) {
    const fileTask = await this.db
      .selectFrom("fileTasks")
      .selectAll()
      .where("id", "=", dto.fileTaskId)
      .executeTakeFirst();

    if (!fileTask || !fileTask.spaceId) {
      throw new NotFoundException("File task not found");
    }

    const ability = await this.spaceAbility.createForUser(
      user,
      fileTask.spaceId
    );
    if (ability.cannot(SpaceCaslAction.Read, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    return fileTask;
  }
}
