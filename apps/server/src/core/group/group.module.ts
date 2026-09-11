import { Module } from "@nestjs/common";
import { GroupController } from "./group.controller";
import { GroupService } from "./services/group.service";
import { GroupUserService } from "./services/group-user.service";

@Module({
  controllers: [GroupController],
  exports: [GroupService, GroupUserService],
  imports: [],
  providers: [GroupService, GroupUserService],
})
export class GroupModule {}
