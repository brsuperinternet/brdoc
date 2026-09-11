import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { SpaceRole } from "../../../common/helpers/types/permission";
import { SpaceIdDto } from "./space-id.dto";

export class UpdateSpaceMemberRoleDto extends SpaceIdDto {
  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsNotEmpty()
  @IsUUID()
  groupId: string;

  @IsEnum(SpaceRole)
  role: string;
}
