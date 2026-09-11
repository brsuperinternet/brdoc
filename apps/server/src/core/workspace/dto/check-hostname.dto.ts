import { Transform, TransformFnParams } from "class-transformer";
import { MinLength } from "class-validator";

export class CheckHostnameDto {
  @MinLength(1)
  @Transform(({ value }: TransformFnParams) => value?.trim())
  hostname: string;
}
