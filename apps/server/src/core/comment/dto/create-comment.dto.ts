import {
  IsIn,
  IsJSON,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";
import { z } from "zod";

const yjsIdSchema = z.object({
  client: z.number().int().nonnegative(),
  clock: z.number().int().nonnegative(),
});

const yjsRelativePositionSchema = z.object({
  assoc: z.number().int(),
  item: yjsIdSchema.nullable(),
  tname: z.string().nullable(),
  type: yjsIdSchema,
});

export const yjsSelectionSchema = z.object({
  anchor: yjsRelativePositionSchema,
  head: yjsRelativePositionSchema,
});

export class CreateCommentDto {
  @IsString()
  pageId: string;

  @IsJSON()
  content: any;

  @IsOptional()
  @IsString()
  selection: string;

  @IsOptional()
  @IsIn(["inline", "page"])
  type: string;

  @IsOptional()
  @IsUUID()
  parentCommentId: string;

  @IsOptional()
  @IsObject()
  yjsSelection?: {
    anchor: any;
    head: any;
  };
}
