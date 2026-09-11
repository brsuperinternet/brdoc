import {
  Document,
  INumberingOptions,
  IPropertiesOptions,
  ISectionOptions,
  Packer,
  SectionType,
} from "docx";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { IFootnotes, SerializationState } from "./types";

export function createShortId() {
  return Math.random().toString(36).slice(2, 11);
}

export function buildDoc(
  state: SerializationState,
  opts?: IPropertiesOptions
): Document {
  let sections = state?.sections?.length
    ? state.sections.map((section) => ({
        children: section.children,
        footers: section.config.footers,
        headers: section.config.headers,
        properties: section.config.properties || {
          type: SectionType.CONTINUOUS,
        },
      }))
    : undefined;
  if (!sections) {
    sections = [
      {
        children: state?.children || [],
        footers: undefined,
        headers: undefined,
        properties: {
          type: SectionType.CONTINUOUS,
        },
      },
    ];
  }

  const doc = new Document({
    footnotes: state.footnotes,
    numbering: {
      config: state.numbering,
    },
    sections,
    ...(opts || {}),
  });
  return doc;
}

/**
 *  @deprecated - use `buildDoc` instead
 *  Creates a docx document from the given state.
 * */
export function createDocFromState(state: {
  numbering: INumberingOptions["config"];
  children: ISectionOptions["children"];
  footnotes?: IFootnotes;
}) {
  return buildDoc({
    footnotes: state.footnotes,
    numbering: state.numbering,
    sections: [
      {
        children: state.children,
        config: {},
      },
    ],
  });
}

export async function writeDocx(
  doc: Document,
  /**
   * @deprecated use `.then()` or `await` instead
   */
  write?: ((buffer: Buffer) => void) | ((buffer: Buffer) => Promise<void>)
) {
  const buffer = await Packer.toBuffer(doc);
  await write?.(buffer);
  return buffer;
}

export function getLatexFromNode(node: ProsemirrorNode): string {
  let math = "";
  node.forEach((child) => {
    if (child.isText) {
      math += child.text;
    }
    // TODO: improve this as we may have other things in the future
  });
  return math;
}
