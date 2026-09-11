import {
  AlignmentType,
  convertInchesToTwip,
  ILevelsOptions,
  LevelFormat,
} from "docx";
import { INumbering } from "./types";

function basicIndentStyle(
  indent: number
): Pick<ILevelsOptions, "style" | "alignment"> {
  return {
    alignment: AlignmentType.START,
    style: {
      paragraph: {
        indent: {
          hanging: convertInchesToTwip(0.18),
          left: convertInchesToTwip(indent),
        },
      },
    },
  };
}

const numbered = Array(3)
  .fill([
    LevelFormat.DECIMAL,
    LevelFormat.LOWER_LETTER,
    LevelFormat.LOWER_ROMAN,
  ])
  .flat()
  .map((format, level) => ({
    format,
    level,
    text: `%${level + 1}.`,
    ...basicIndentStyle((level + 1) / 2),
  }));

const bullets = Array(3)
  .fill(["●", "○", "■"])
  .flat()
  .map((text, level) => ({
    format: LevelFormat.BULLET,
    level,
    text,
    ...basicIndentStyle((level + 1) / 2),
  }));

const styles = {
  bullets,
  numbered,
};

export type NumberingStyles = keyof typeof styles;

export function createNumbering(
  reference: string,
  style: NumberingStyles
): INumbering {
  return {
    levels: styles[style],
    reference,
  };
}
