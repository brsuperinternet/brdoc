import { IsNotEmpty, IsString } from "class-validator";

export class SpaceWatcherDto {
  @IsString()
  @IsNotEmpty()
  spaceId: string;
}
