import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsUUID } from "class-validator";
import { CreateGroupDto } from "./create-group.dto";

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @IsNotEmpty()
  @IsUUID()
  groupId: string;
}
