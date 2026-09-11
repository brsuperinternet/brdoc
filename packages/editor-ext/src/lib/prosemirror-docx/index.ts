// MIT - https://github.com/curvenote/prosemirror-docx/

export {
  type DocxImageResolver,
  defaultAsyncNodes,
  defaultMarks,
  pageNodeToDocxBuffer,
} from "./schema";
export type {
  MarkSerializer,
  NodeSerializer,
  NodeSerializerAsync,
  Options,
  OptionsAsync,
} from "./serializer";

export {
  DocxSerializer,
  DocxSerializerAsync,
  DocxSerializerState,
  DocxSerializerStateAsync,
  MAX_IMAGE_WIDTH,
} from "./serializer";
export type { SectionConfig, SerializationState } from "./types";
export { buildDoc, createDocFromState, writeDocx } from "./utils";
