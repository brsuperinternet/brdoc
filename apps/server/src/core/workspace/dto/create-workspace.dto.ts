import { Transform, TransformFnParams } from "class-transformer";
import {
  IsAlphanumeric,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateWorkspaceDto {
  @MinLength(1)
  @MaxLength(64)
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  name: string;

  @IsOptional()
  @MinLength(4)
  @MaxLength(30)
  @IsAlphanumeric()
  @Transform(({ value }: TransformFnParams) => value?.trim().toLowerCase())
  hostname?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
