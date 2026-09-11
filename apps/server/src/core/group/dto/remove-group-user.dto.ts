import { IsUUID } from "class-validator";
import { GroupIdDto } from "./group-id.dto";

export class RemoveGroupUserDto extends GroupIdDto {
  @IsUUID()
  userId: string;
}
