import {
  Attachment,
  BaseEmbed as BaseEmbedNode,
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
  Indent,
  LinkExtension,
  MathBlock,
  MathInline,
  Mention,
  PageBreak,
  SearchAndReplace,
  Selection,
  SharedStorage,
  Status,
  Subpages,
  TableCell,
  TableDndExtension,
  TableHandleCommandsExtension,
  TableHeader,
  TableHeaderPin,
  TableReadonlySort,
  TableRow,
  TableView,
  TiptapAudio,
  TiptapImage,
  TiptapPdf,
  TiptapVideo,
  TrailingNode,
  TransclusionReference,
  TransclusionSource,
  UniqueID,
} from "@docmost/editor-ext";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { markInputRule } from "@tiptap/core";
import { Code } from "@tiptap/extension-code";
import { Collaboration, isChangeOrigin } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import { Color } from "@tiptap/extension-color";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import SubScript from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { Youtube } from "@tiptap/extension-youtube";
import { CharacterCount, UndoRedo } from "@tiptap/extensions";
import { ReactMarkViewRenderer, ReactNodeViewRenderer } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { countWords } from "alfaaz";
import clojure from "highlight.js/lib/languages/clojure";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import elixir from "highlight.js/lib/languages/elixir";
import erlang from "highlight.js/lib/languages/erlang";
import fortran from "highlight.js/lib/languages/fortran";
import haskell from "highlight.js/lib/languages/haskell";
import plaintext from "highlight.js/lib/languages/plaintext";
import powershell from "highlight.js/lib/languages/powershell";
import scala from "highlight.js/lib/languages/scala";
import abap from "highlightjs-sap-abap";
import { common, createLowlight } from "lowlight";
import AttachmentView from "@/features/editor/components/attachment/attachment-view.tsx";
import AudioView from "@/features/editor/components/audio/audio-view.tsx";
import { BaseEmbedView } from "@/features/editor/components/base-embed/base-embed-view.tsx";
import CalloutView from "@/features/editor/components/callout/callout-view.tsx";
import CodeBlockView from "@/features/editor/components/code-block/code-block-view.tsx";
import {
  buildResizeClasses,
  createResizeHandle,
} from "@/features/editor/components/common/node-resize-handles.ts";
import EmbedView from "@/features/editor/components/embed/embed-view.tsx";
import ExcalidrawView from "@/features/editor/components/excalidraw/excalidraw-view-lazy.tsx";
import {
  createImageHandle,
  imageResizeClasses,
} from "@/features/editor/components/image/image-resize-handles.ts";
import ImageView from "@/features/editor/components/image/image-view.tsx";
import LinkView from "@/features/editor/components/link/link-view.tsx";
import MathBlockView from "@/features/editor/components/math/math-block.tsx";
import MathInlineView from "@/features/editor/components/math/math-inline.tsx";
import mentionRenderItems from "@/features/editor/components/mention/mention-suggestion.ts";
import MentionView from "@/features/editor/components/mention/mention-view.tsx";
import PdfView from "@/features/editor/components/pdf/pdf-view.tsx";
import getSuggestionItems from "@/features/editor/components/slash-menu/menu-items";
import renderItems from "@/features/editor/components/slash-menu/render-items";
import StatusView from "@/features/editor/components/status/status-view.tsx";
import SubpagesView from "@/features/editor/components/subpages/subpages-view.tsx";
import TransclusionReferenceView from "@/features/editor/components/transclusion/transclusion-reference-view.tsx";
import TransclusionView from "@/features/editor/components/transclusion/transclusion-view.tsx";
import VideoView from "@/features/editor/components/video/video-view.tsx";
import AutoJoiner from "@/features/editor/extensions/autojoiner.ts";
import { CleanStyles } from "@/features/editor/extensions/clean-styles.ts";
import { TiptapDocument } from "@/features/editor/extensions/document";
import GlobalDragHandle from "@/features/editor/extensions/drag-handle.ts";
import { MarkdownClipboard } from "@/features/editor/extensions/markdown-clipboard.ts";
import { Placeholder } from "@/features/editor/extensions/placeholder";
import SlashCommand, {
  SlashCommandExtension as Command,
} from "@/features/editor/extensions/slash-command";
import {
  randomElement,
  userColors,
} from "@/features/editor/extensions/utils.ts";
import { IUser } from "@/features/user/types/user.types.ts";
import i18n from "@/i18n.ts";
import DrawioView from "../components/drawio/drawio-view";
import EmojiCommand from "./emoji-command";

const lowlight = createLowlight(common);
lowlight.register("mermaid", plaintext);
lowlight.register("powershell", powershell);
lowlight.register("abap", abap);
lowlight.register("erlang", erlang);
lowlight.register("elixir", elixir);
lowlight.register("dockerfile", dockerfile);
lowlight.register("clojure", clojure);
lowlight.register("fortran", fortran);
lowlight.register("haskell", haskell);
lowlight.register("scala", scala);

// @ts-expect-error
export const mainExtensions = [
  StarterKit.configure({
    code: false,
    codeBlock: false,
    document: false,
    dropcursor: {
      color: "#70CFF8",
      width: 3,
    },
    heading: false,
    link: false,
    trailingNode: false,
    undoRedo: false,
  }),
  TiptapDocument,
  // Override TipTap's Code extension to fix the inline code input rule.
  // The upstream regex /(^|[^`])`([^`]+)`(?!`)$/ captures the character
  // before the opening backtick as part of the match, causing markInputRule
  // to delete it. Using a lookbehind avoids including it in the match.
  Code.configure({
    HTMLAttributes: {
      spellcheck: false,
    },
  }).extend({
    addInputRules() {
      return [
        markInputRule({
          find: /(?:^|(?<=[^`]))`([^`]+)`(?!`)$/,
          type: this.type,
        }),
      ];
    },
    addKeyboardShortcuts() {
      return {
        Enter: ({ editor }) => {
          const { from, to } = editor.state.selection;
          if (from !== to) {
            return false;
          }
          if (!editor.isActive("code")) {
            return false;
          }

          const $from = editor.state.doc.resolve(from);
          const codeType = editor.state.schema.marks.code;
          const nodeAfter = $from.nodeAfter;

          if (nodeAfter && codeType.isInSet(nodeAfter.marks)) {
            return false;
          }

          return editor.chain().unsetCode().splitBlock().run();
        },
      };
    },
  }),
  SharedStorage,
  Heading,
  UniqueID.configure({
    filterTransaction: (transaction) => !isChangeOrigin(transaction),
    types: ["heading", "paragraph", "transclusionSource"],
  }),
  Placeholder.configure({
    includeChildren: true,
    placeholder: ({ editor, node, pos }) => {
      if (node.type.name === "heading") {
        return i18n.t("Heading {{level}}", { level: node.attrs.level });
      }
      if (node.type.name === "detailsSummary") {
        return i18n.t("Toggle title");
      }
      if (node.type.name === "paragraph") {
        const doc = editor.state.doc;
        if (pos >= 0 && pos <= doc.content.size) {
          const parentName = doc.resolve(pos).parent.type.name;
          if (
            parentName === "column" ||
            parentName === "tableCell" ||
            parentName === "tableHeader" ||
            parentName === "callout" ||
            parentName === "blockquote" ||
            parentName === "footnote"
          ) {
            return i18n.t("Write...");
          }
        }
        return i18n.t('Write anything. Enter "/" for commands');
      }
    },
    showOnlyWhenEditable: true,
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Indent,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  LinkExtension.configure({
    openOnClick: false,
  }).extend({
    addMarkView() {
      return ReactMarkViewRenderer(LinkView);
    },
  }),
  Superscript,
  SubScript,
  Highlight.configure({
    multicolor: true,
  }),
  Typography,
  TrailingNode,
  GlobalDragHandle.configure({
    atomNodes: ["base"],
    customNodes: ["transclusionSource", "transclusionReference"],
  }),
  TextStyle,
  Color,
  SlashCommand,
  EmojiCommand,
  Comment.configure({
    HTMLAttributes: {
      class: "comment-mark",
    },
  }),
  Mention.configure({
    HTMLAttributes: {
      class: "mention",
    },
    suggestion: {
      allowSpaces: true,
      items: () => [],
      // @ts-expect-error
      render: mentionRenderItems,
    },
  }).extend({
    addNodeView() {
      // Force the react node view to render immediately using flush sync (https://github.com/ueberdosis/tiptap/blob/b4db352f839e1d82f9add6ee7fb45561336286d8/packages/react/src/ReactRenderer.tsx#L183-L191)
      this.editor.isInitialized = true;

      return ReactNodeViewRenderer(MentionView);
    },
  }),
  CustomTable.configure({
    allowTableNodeSelection: true,
    cellMinWidth: 49,
    lastColumnResizable: true,
    resizable: true,
    View: TableView,
  }),
  TableRow,
  TableCell,
  TableHeader,
  TableDndExtension,
  TableHandleCommandsExtension,
  TableHeaderPin,
  TableReadonlySort,
  MathInline.configure({
    view: MathInlineView,
  }),
  MathBlock.configure({
    view: MathBlockView,
  }),
  Details,
  DetailsSummary,
  DetailsContent,
  Youtube.configure({
    addPasteHandler: false,
    controls: true,
    nocookie: true,
  }),
  TiptapImage.configure({
    allowBase64: false,
    resize: {
      alwaysPreserveAspectRatio: true,
      className: imageResizeClasses,
      //@ts-expect-error
      createCustomHandle: createImageHandle,
      directions: ["left", "right"],
      enabled: true,
      minHeight: 16,
      minWidth: 24,
    },
    view: ImageView,
  }),
  TiptapVideo.configure({
    resize: {
      alwaysPreserveAspectRatio: true,
      className: buildResizeClasses("node-video"),
      //@ts-expect-error
      createCustomHandle: createResizeHandle,
      directions: ["left", "right"],
      enabled: true,
      minHeight: 16,
      minWidth: 24,
    },
    view: VideoView,
  }),
  TiptapAudio.configure({
    view: AudioView,
  }),
  Callout.configure({
    view: CalloutView,
  }),
  CustomCodeBlock.configure({
    enableTabIndentation: true,
    HTMLAttributes: {
      spellcheck: false,
    },
    //@ts-expect-error
    lowlight,
    tabSize: 2,
    view: CodeBlockView,
  }),
  Selection,
  Attachment.configure({
    view: AttachmentView,
  }),
  Drawio.configure({
    resize: {
      alwaysPreserveAspectRatio: true,
      className: buildResizeClasses("node-drawio"),
      //@ts-expect-error
      createCustomHandle: createResizeHandle,
      directions: ["left", "right"],
      enabled: true,
      minHeight: 16,
      minWidth: 24,
    },
    view: DrawioView,
  }),
  Excalidraw.configure({
    resize: {
      alwaysPreserveAspectRatio: true,
      className: buildResizeClasses("node-excalidraw"),
      //@ts-expect-error
      createCustomHandle: createResizeHandle,
      directions: ["left", "right"],
      enabled: true,
      minHeight: 16,
      minWidth: 24,
    },
    view: ExcalidrawView,
  }),
  Embed.configure({
    view: EmbedView,
  }),
  TiptapPdf.configure({
    view: PdfView,
  }),
  PageBreak,
  Subpages.configure({
    view: SubpagesView,
  }),
  Status.configure({
    view: StatusView,
  }),
  TransclusionSource.configure({
    view: TransclusionView,
  }),
  TransclusionReference.configure({
    view: TransclusionReferenceView,
  }),
  BaseEmbedNode.extend({
    addNodeView() {
      return ReactNodeViewRenderer(BaseEmbedView);
    },
  }),
  MarkdownClipboard.configure({
    transformPastedText: true,
  }),
  CleanStyles,
  CharacterCount.configure({
    wordCounter: (text) => countWords(text),
  }),
  SearchAndReplace.extend({
    addKeyboardShortcuts() {
      return {
        Escape: () => {
          const event = new CustomEvent("closeFindDialogFromEditor", {});
          document.dispatchEvent(event);
          return false;
        },
        "Mod-f": () => {
          const event = new CustomEvent("openFindDialogFromEditor", {});
          document.dispatchEvent(event);
          return true;
        },
      };
    },
  }).configure(),
  Columns,
  Column,
  Footnotes,
  Footnote,
  FootnoteReference,
  AutoJoiner.configure({
    elementsToJoin: [],
  }),
] as any;

type CollabExtensions = (provider: HocuspocusProvider, user: IUser) => any[];

const TEMPLATE_EXCLUDED_SLASH_ITEMS = new Set([
  "Image",
  "Video",
  "File attachment",
  "Draw.io (diagrams.net)",
  "Excalidraw (Whiteboard)",
  "Audio",
  "Synced block",
  "Base (Inline)",
  "Kanban",
]);

const TemplateSlashCommand = Command.configure({
  suggestion: {
    items: ({ query }: { query: string }) =>
      getSuggestionItems({
        excludeItems: TEMPLATE_EXCLUDED_SLASH_ITEMS,
        query,
      }),
    render: renderItems,
  },
});

export const templateExtensions = [
  ...mainExtensions.filter((ext: any) => ext !== SlashCommand),
  TemplateSlashCommand,
  UndoRedo,
] as any;

export const collabExtensions: CollabExtensions = (provider, user) => [
  Collaboration.configure({
    document: provider.document,
    provider,
  }),
  CollaborationCaret.configure({
    provider,
    user: {
      color: randomElement(userColors),
      name: user.name,
    },
  }),
];
