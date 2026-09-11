import {
  FootnoteReferenceRun,
  HeadingLevel,
  Paragraph,
  ShadingType,
} from "docx";
import { Node } from "prosemirror-model";
import {
  DocxSerializerAsync,
  MarkSerializer,
  NodeSerializerAsync,
  OptionsAsync,
} from "./serializer";
import { writeDocx } from "./utils";

export type DocxImageResolver = OptionsAsync["getImageBuffer"];

// docx requires a 6-digit hex color (no leading #). Convert #rgb, #rrggbb,
// and rgb()/rgba() inputs to 6-digit hex; return undefined for anything else
// (named colors, hsl, etc.) so the caller omits the color rather than letting
// docx throw "Invalid hex value".
function toDocxColor(input?: string): string | undefined {
  if (!input) {
    return undefined;
  }
  const value = input.trim().toLowerCase();
  const hex = value.startsWith("#") ? value.slice(1) : value;
  if (/^[0-9a-f]{6}$/.test(hex)) {
    return hex;
  }
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return hex
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const rgb = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    const channel = (n: string) =>
      Math.max(0, Math.min(255, Number.parseInt(n, 10)))
        .toString(16)
        .padStart(2, "0");
    return channel(rgb[1]) + channel(rgb[2]) + channel(rgb[3]);
  }
  return undefined;
}

// Images and diagrams embed via the image resolver; the URL (with its file
// extension) is passed through so docx can infer the image type.
const renderImage: NodeSerializerAsync[string] = async (state, node) => {
  const src = node.attrs?.src || node.attrs?.attachmentId;
  if (src) {
    try {
      await state.image(src, 100);
    } catch {
      // Unrenderable/missing image: skip rather than fail the whole export.
    }
  }
  state.closeBlock(node);
};

// Non-embeddable media render as a labelled line.
const renderFileLine: NodeSerializerAsync[string] = (state, node) => {
  const label =
    node.attrs?.name || node.attrs?.src || node.attrs?.url || "attachment";
  state.text(label);
  state.closeBlock(node);
};

const renderEmbedLine: NodeSerializerAsync[string] = (state, node) => {
  const label = node.attrs?.src || node.attrs?.url || "embed";
  state.text(label);
  state.closeBlock(node);
};

export const defaultAsyncNodes: NodeSerializerAsync = {
  attachment: renderFileLine,
  audio: renderFileLine,
  base() {},
  async blockquote(state, node) {
    await state.renderContent(node, { style: "IntenseQuote" });
  },
  async bulletList(state, node) {
    await state.renderList(node, "bullets");
  },
  async callout(state, node) {
    await state.renderContent(node, { style: "IntenseQuote" });
  },
  async codeBlock(state, node) {
    await state.renderContent(node);
    state.closeBlock(node);
  },
  async column(state, node) {
    await state.renderContent(node);
  },
  async columns(state, node) {
    await state.renderContent(node);
  },
  async details(state, node) {
    await state.renderContent(node);
  },
  async detailsContent(state, node) {
    await state.renderContent(node);
  },
  async detailsSummary(state, node) {
    await state.renderInline(node);
    state.closeBlock(node, { heading: HeadingLevel.HEADING_4 });
  },
  drawio: renderImage,
  embed: renderEmbedLine,
  excalidraw: renderImage,
  // items are consumed by the footnotes handler above
  footnote() {},
  footnoteReference(state, node) {
    const number =
      Number(node.attrs?.referenceNumber) || state.$footnoteCounter + 1;
    state.$footnoteCounter = Math.max(state.$footnoteCounter, number);
    // seed an empty body so the reference stays valid even if the trailing
    // footnotes list is missing; the footnotes node overwrites it with content
    if (!state.footnotes[number]) {
      state.footnotes[number] = { children: [new Paragraph("")] };
    }
    state.current.push(new FootnoteReferenceRun(number));
  },
  async footnotes(state, node) {
    for (let i = 0; i < node.childCount; i += 1) {
      const item = node.child(i);
      const number =
        Number(String(item.attrs?.id ?? "").replace("fn:", "")) || i + 1;
      await state.footnoteDefinition(item, number);
    }
  },
  hardBreak(state) {
    state.addRunOptions({ break: 1 });
  },
  async heading(state, node) {
    await state.renderInline(node);
    const heading = [
      HeadingLevel.HEADING_1,
      HeadingLevel.HEADING_2,
      HeadingLevel.HEADING_3,
      HeadingLevel.HEADING_4,
      HeadingLevel.HEADING_5,
      HeadingLevel.HEADING_6,
    ][(node.attrs.level ?? 1) - 1];
    state.closeBlock(node, { heading });
  },
  horizontalRule(state, node) {
    state.closeBlock(node, { thematicBreak: true });
    state.closeBlock(node);
  },
  image: renderImage,
  async listItem(state, node) {
    await state.renderListItem(node);
  },
  mathBlock(state, node) {
    state.math(node.attrs?.text ?? "", { inline: false, numbered: false });
    state.closeBlock(node);
  },
  // Docmost stores LaTeX in attrs.text.
  mathInline(state, node) {
    state.math(node.attrs?.text ?? "", { inline: true });
  },
  mention(state, node) {
    state.text(`@${node.attrs?.label ?? ""}`);
  },
  async orderedList(state, node) {
    await state.renderList(node, "numbered");
  },
  pageBreak(state, node) {
    state.closeBlock(node, { pageBreakBefore: true });
  },
  async paragraph(state, node) {
    await state.renderInline(node);
    state.closeBlock(node);
  },
  pdf: renderFileLine,
  status(state, node) {
    state.text(`[${node.attrs?.text ?? ""}]`);
  },
  // No usable static export representation: skip without failing.
  subpages() {},
  async table(state, node) {
    await state.table(node);
  },
  async taskItem(state, node) {
    if (state.currentNumbering) {
      state.addParagraphOptions({ numbering: state.currentNumbering });
    }
    state.text(node.attrs?.checked ? "☑ " : "☐ ");
    await state.renderContent(node);
  },
  async taskList(state, node) {
    await state.renderList(node, "bullets");
  },
  text(state, node) {
    state.text(node.text ?? "");
  },
  transclusionReference() {},
  async transclusionSource(state, node) {
    await state.renderContent(node);
  },
  video: renderFileLine,
  youtube: renderEmbedLine,
};

export const defaultMarks: MarkSerializer = {
  bold() {
    return { bold: true };
  },
  code() {
    return {
      color: "000000",
      font: { name: "Monospace" },
      shading: { color: "D2D3D2", fill: "D2D3D2", type: ShadingType.SOLID },
    };
  },
  // Comments are editor-only; drop the annotation in the export.
  comment() {
    return {};
  },
  highlight(_state, _node, mark) {
    const fill = toDocxColor(mark.attrs?.color);
    return fill
      ? { shading: { fill, type: ShadingType.CLEAR } }
      : { highlight: "yellow" };
  },
  italic() {
    return { italics: true };
  },
  link() {
    // Handled specifically in the serializer; Word treats links as nodes.
    return {};
  },
  strike() {
    return { strike: true };
  },
  subscript() {
    return { subScript: true };
  },
  superscript() {
    return { superScript: true };
  },
  // @tiptap/extension-color stores the color on the textStyle mark.
  textStyle(_state, _node, mark) {
    const color = toDocxColor(mark.attrs?.color);
    return color ? { color } : {};
  },
  underline() {
    return { underline: {} };
  },
};

export async function pageNodeToDocxBuffer(
  doc: Node,
  getImageBuffer: DocxImageResolver
): Promise<Buffer> {
  const serializer = new DocxSerializerAsync(defaultAsyncNodes, defaultMarks);
  const wordDoc = await serializer.serializeAsync(
    doc,
    { getImageBuffer },
    // docx's built-in heading styles are blue (#2E74B5 / #1F4D78). The editor
    // has no heading color, so override the default heading run colors to the
    // normal text color. Sizes/italics mirror docx's own defaults so only the
    // color changes.
    () =>
      ({
        styles: {
          default: {
            document: { paragraph: { spacing: { after: 160 } } },
            heading1: {
              paragraph: {
                keepLines: true,
                keepNext: true,
                spacing: { after: 0, before: 240 },
              },
              run: { color: "000000", size: 32 },
            },
            heading2: {
              paragraph: {
                keepLines: true,
                keepNext: true,
                spacing: { after: 0, before: 40 },
              },
              run: { color: "000000", size: 26 },
            },
            heading3: {
              paragraph: {
                keepLines: true,
                keepNext: true,
                spacing: { after: 0, before: 40 },
              },
              run: { color: "000000", size: 24 },
            },
            heading4: {
              paragraph: {
                keepLines: true,
                keepNext: true,
                spacing: { after: 0, before: 40 },
              },
              run: { color: "000000", italics: true },
            },
            heading5: {
              paragraph: {
                keepLines: true,
                keepNext: true,
                spacing: { after: 0, before: 40 },
              },
              run: { color: "000000" },
            },
            heading6: {
              paragraph: {
                keepLines: true,
                keepNext: true,
                spacing: { after: 0, before: 40 },
              },
              run: { color: "000000" },
            },
          },
        },
      }) as any
  );
  return writeDocx(wordDoc);
}
