import { IsNotEmpty, IsString } from "class-validator";

export class WatcherPageDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;
}
