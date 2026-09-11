import { Module } from "@nestjs/common";
import { SpaceService } from "./services/space.service";
import { SpaceMemberService } from "./services/space-member.service";
import { SpaceController } from "./space.controller";

@Module({
  controllers: [SpaceController],
  exports: [SpaceService, SpaceMemberService],
  imports: [],
  providers: [SpaceService, SpaceMemberService],
})
export class SpaceModule {}
