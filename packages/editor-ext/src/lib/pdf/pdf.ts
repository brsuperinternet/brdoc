import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { isInternalFileUrl, sanitizeUrl } from "../utils";

export type PdfOptions = {
  view: any;
  HTMLAttributes: Record<string, any>;
};

export type PdfAttributes = {
  src?: string;
  name?: string;
  attachmentId?: string;
  size?: number;
  width?: number;
  height?: number;
  placeholder?: {
    id: string;
    name: string;
  };
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pdfBlock: {
      setPdf: (attributes: PdfAttributes) => ReturnType;
    };
  }
}

export const TiptapPdf = Node.create<PdfOptions>({
  addAttributes() {
    return {
      attachmentId: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes: PdfAttributes) => ({
          "data-attachment-id": attributes.attachmentId,
        }),
      },
      height: {
        default: 600,
        parseHTML: (element) => {
          const raw = element.getAttribute("height");
          if (!raw) {
            return null;
          }
          const num = Number.parseFloat(raw);
          return isNaN(num) ? null : num;
        },
        renderHTML: (attributes: PdfAttributes) => ({
          height: attributes.height,
        }),
      },
      name: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-name"),
        renderHTML: (attributes: PdfAttributes) => ({
          "data-name": attributes.name,
        }),
      },
      placeholder: {
        default: null,
        rendered: false,
      },
      size: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-size"),
        renderHTML: (attributes: PdfAttributes) => ({
          "data-size": attributes.size,
        }),
      },
      src: {
        default: "",
        parseHTML: (element) => {
          const src = element.getAttribute("src");
          const sanitized = sanitizeUrl(src);
          return isInternalFileUrl(sanitized) ? sanitized : "";
        },
        renderHTML: (attributes) => ({
          src: isInternalFileUrl(attributes.src)
            ? sanitizeUrl(attributes.src)
            : "",
        }),
      },
      width: {
        default: 800,
        parseHTML: (element) => {
          const raw = element.getAttribute("width");
          if (!raw) {
            return null;
          }
          const num = Number.parseFloat(raw);
          return isNaN(num) ? null : num;
        },
        renderHTML: (attributes: PdfAttributes) => ({
          width: attributes.width,
        }),
      },
    };
  },

  addCommands() {
    return {
      setPdf:
        (attrs: PdfAttributes) =>
        ({ commands }) =>
          commands.insertContent({
            attrs,
            type: "pdf",
          }),
    };
  },

  addNodeView() {
    this.editor.isInitialized = true;
    return ReactNodeViewRenderer(this.options.view);
  },

  addOptions() {
    return {
      HTMLAttributes: {},
      view: null,
    };
  },
  atom: true,
  defining: true,
  draggable: true,

  group: "block",
  isolating: true,
  name: "pdf",

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": this.name },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      [
        "iframe",
        {
          height: HTMLAttributes.height || 600,
          src: isInternalFileUrl(HTMLAttributes.src)
            ? sanitizeUrl(HTMLAttributes.src)
            : "",
          width: HTMLAttributes.width || 800,
        },
      ],
    ];
  },
});
