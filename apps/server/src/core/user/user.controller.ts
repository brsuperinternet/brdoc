import { WorkspaceRepo } from "@docmost/db/repos/workspace/workspace.repo";
import { User, Workspace } from "@docmost/db/types/entity.types";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthUser } from "../../common/decorators/auth-user.decorator";
import { AuthWorkspace } from "../../common/decorators/auth-workspace.decorator";
import { OAuthScope } from "../../common/decorators/oauth-scope.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserService } from "./user.service";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly workspaceRepo: WorkspaceRepo
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post("me")
  @OAuthScope("read")
  async getUserInfo(
    @AuthUser() authUser: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    const memberCount = await this.workspaceRepo.getActiveUserCount(
      workspace.id
    );

    const { licenseKey, ...rest } = workspace;

    const workspaceInfo = {
      ...rest,
      memberCount,
    };

    return { user: authUser, workspace: workspaceInfo };
  }

  @HttpCode(HttpStatus.OK)
  @Post("update")
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace
  ) {
    return this.userService.update(updateUserDto, user.id, workspace);
  }
}
