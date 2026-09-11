import {
  Attachment,
  addUniqueIdsToDoc,
  BaseEmbed,
  Callout,
  Column,
  Columns,
  Comment,
  CustomCodeBlock,
  CustomTable,
  Details,
  DetailsContent,
  DetailsSummary,
  Drawio,
  Embed,
  Excalidraw,
  Footnote,
  FootnoteReference,
  Footnotes,
  Heading,
  Highlight,
  htmlToMarkdown,
  Indent,
  LinkExtension,
  MathBlock,
  MathInline,
  Mention,
  PageBreak,
  Status,
  Subpages,
  TableCell,
  TableHeader,
  TableRow,
  TiptapAudio,
  TiptapImage,
  TiptapPdf,
  TiptapVideo,
  TrailingNode,
  TransclusionReference,
  TransclusionSource,
  UniqueID,
} from "@docmost/editor-ext";
import { Logger } from "@nestjs/common";
import {
  extensions as coreExtensions,
  generateText,
  getSchema,
  JSONContent,
} from "@tiptap/core";
import { Color } from "@tiptap/extension-color";
import { Document } from "@tiptap/extension-document";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import SubScript from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { Youtube } from "@tiptap/extension-youtube";
// @tiptap/html library works best for generating prosemirror json state but not HTML
// see: https://github.com/ueberdosis/tiptap/issues/5352
// see:https://github.com/ueberdosis/tiptap/issues/4089
//import { generateJSON } from '@tiptap/html';
import { Node, Schema } from "@tiptap/pm/model";
import { StarterKit } from "@tiptap/starter-kit";
import * as Y from "yjs";
import { collapseBlankLines } from "../common/helpers";
import { generateHTML, generateJSON } from "../common/helpers/prosemirror/html";

export const tiptapExtensions = [
  coreExtensions.TextDirection.configure({ direction: "auto" }),
  StarterKit.configure({
    codeBlock: false,
    document: false,
    heading: false,
    link: false,
    trailingNode: false,
  }),
  Document.extend({
    content: "block+ footnotes?",
  }),
  Heading,
  UniqueID.configure({
    types: ["heading", "paragraph", "transclusionSource"],
  }),
  Comment,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Indent,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  LinkExtension,
  Superscript,
  SubScript,
  Highlight,
  Typography,
  TrailingNode,
  TextStyle,
  Color,
  MathInline,
  MathBlock,
  Details,
  DetailsContent,
  DetailsSummary,
  CustomTable,
  TableCell,
  TableRow,
  TableHeader,
  Youtube,
  TiptapImage,
  TiptapVideo,
  TiptapAudio,
  TiptapPdf,
  PageBreak,
  Callout,
  Attachment,
  CustomCodeBlock,
  Drawio,
  Excalidraw,
  Embed,
  Mention,
  Subpages,
  Columns,
  Column,
  Status,
  TransclusionSource,
  TransclusionReference,
  BaseEmbed,
  Footnotes,
  Footnote,
  FootnoteReference,
] as any;

export function jsonToHtml(tiptapJson: any) {
  return generateHTML(tiptapJson, tiptapExtensions);
}

export function htmlToJson(html: string) {
  const pmJson = generateJSON(html, tiptapExtensions);

  try {
    return addUniqueIdsToDoc(pmJson, tiptapExtensions);
  } catch (error) {
    console.warn("failed to add unique ids to doc", error);
    return pmJson;
  }
}

export function jsonToText(tiptapJson: JSONContent) {
  return collapseBlankLines(generateText(tiptapJson, tiptapExtensions));
}

export function jsonToNode(tiptapJson: JSONContent) {
  const schema = getSchema(tiptapExtensions);
  try {
    return Node.fromJSON(schema, tiptapJson);
  } catch (error) {
    if (
      error instanceof RangeError &&
      error.message.includes("Unknown node type")
    ) {
      Logger.warn("Stripping unknown node types from document:", error.message);
      const cleanedJson = stripUnknownNodes(tiptapJson, schema);
      return Node.fromJSON(schema, cleanedJson);
    }
    throw error;
  }
}

export function getPageId(documentName: string) {
  return documentName.split(".")[1];
}

export function isEmptyParagraphDoc(tiptapJson: JSONContent): boolean {
  if (!tiptapJson || tiptapJson.type !== "doc") {
    return false;
  }
  const content = tiptapJson.content;
  if (!Array.isArray(content) || content.length !== 1) {
    return false;
  }
  const child = content[0];
  if (!child || child.type !== "paragraph") {
    return false;
  }
  return (
    !child.content ||
    (Array.isArray(child.content) && child.content.length === 0)
  );
}

function stripUnknownNodes(
  json: JSONContent,
  schema: Schema
): JSONContent | null {
  if (!json || typeof json !== "object") {
    return json;
  }

  // Recursively clean children first, flattening any unwrapped content
  if (json.content && Array.isArray(json.content)) {
    const newContent: JSONContent[] = [];
    for (const child of json.content) {
      const cleaned = stripUnknownNodes(child, schema);
      if (Array.isArray(cleaned)) {
        newContent.push(...cleaned);
      } else if (cleaned) {
        newContent.push(cleaned);
      }
    }
    json.content = newContent;
  }

  // Check if this node is unknown AFTER processing children
  if (json.type && !schema.nodes[json.type]) {
    // Unwrap: return cleaned children directly instead of wrapping
    return (
      json.content && json.content.length > 0 ? json.content : null
    ) as any;
  }

  return json;
}

export function prosemirrorNodeToYElement(node: any): Y.XmlElement | Y.XmlText {
  if (node.type === "text") {
    const ytext = new Y.XmlText();
    ytext.insert(0, node.text || "");
    if (node.marks?.length > 0) {
      const attrs: Record<string, any> = {};
      for (const mark of node.marks) {
        attrs[mark.type] = mark.attrs || true;
      }
      ytext.format(0, node.text?.length || 0, attrs);
    }
    return ytext;
  }

  const element = new Y.XmlElement(node.type);
  if (node.attrs) {
    for (const [key, value] of Object.entries(node.attrs)) {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, value as any);
      }
    }
  }
  if (node.content?.length > 0) {
    const children = node.content.map(prosemirrorNodeToYElement);
    element.insert(0, children);
  }
  return element;
}

export function jsonToMarkdown(tiptapJson: any): string {
  const html = jsonToHtml(tiptapJson);
  return htmlToMarkdown(html);
}
