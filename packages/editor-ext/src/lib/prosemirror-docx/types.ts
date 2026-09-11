import { INumberingOptions, ISectionOptions, Paragraph } from "docx";

export type Mutable<T> = {
  -readonly [k in keyof T]: T[k];
};

export type IFootnotes = Mutable<
  Readonly<
    Record<
      string,
      {
        readonly children: readonly Paragraph[];
      }
    >
  >
>;

export type INumbering = INumberingOptions["config"][0];

export interface SectionConfig {
  footers?: ISectionOptions["footers"];
  headers?: ISectionOptions["headers"];
  properties?: ISectionOptions["properties"];
}

export interface SerializationState {
  children?: ISectionOptions["children"];
  footnotes?: IFootnotes;
  numbering: INumberingOptions["config"];
  sections?: Array<{
    config: SectionConfig;
    children: ISectionOptions["children"];
  }>;
}
