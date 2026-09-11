import { UserRepo } from "@docmost/db/repos/user/user.repo";
import { Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  controllers: [UserController],
  exports: [UserService, UserRepo],
  providers: [UserService, UserRepo],
})
export class UserModule {}
