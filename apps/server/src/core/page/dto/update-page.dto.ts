import { PartialType } from "@nestjs/mapped-types";
import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, ValidateIf } from "class-validator";
import { ContentFormat, CreatePageDto } from "./create-page.dto";

export type ContentOperation = "append" | "prepend" | "replace";

export class UpdatePageDto extends PartialType(CreatePageDto) {
  @IsString()
  pageId: string;

  @IsOptional()
  content?: string | object;

  @ValidateIf((o) => o.content !== undefined)
  @Transform(({ value }) => value?.toLowerCase())
  @IsIn(["append", "prepend", "replace"])
  operation?: ContentOperation;

  @ValidateIf((o) => o.content !== undefined)
  @Transform(({ value }) => value?.toLowerCase() ?? "json")
  @IsIn(["json", "markdown", "html"])
  format?: ContentFormat;
}
