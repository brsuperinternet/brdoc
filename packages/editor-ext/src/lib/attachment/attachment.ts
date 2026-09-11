import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { sanitizeUrl } from "../utils";

export interface AttachmentOptions {
  HTMLAttributes: Record<string, any>;
  view: any;
}

export interface AttachmentAttributes {
  attachmentId?: string;
  mime?: string; // e.g. application/zip
  name?: string;
  placeholder?: string;
  size?: number;
  url?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    attachment: {
      setAttachment: (attributes: AttachmentAttributes) => ReturnType;
    };
  }
}

export const Attachment = Node.create<AttachmentOptions>({
  addAttributes() {
    return {
      attachmentId: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes: AttachmentAttributes) => ({
          "data-attachment-id": attributes.attachmentId,
        }),
      },
      mime: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-attachment-mime"),
        renderHTML: (attributes: AttachmentAttributes) => ({
          "data-attachment-mime": attributes.mime,
        }),
      },
      name: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-attachment-name"),
        renderHTML: (attributes: AttachmentAttributes) => ({
          "data-attachment-name": attributes.name,
        }),
      },
      placeholder: {
        default: null,
        rendered: false,
      },
      size: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-attachment-size"),
        renderHTML: (attributes: AttachmentAttributes) => ({
          "data-attachment-size": attributes.size,
        }),
      },
      url: {
        default: "",
        parseHTML: (element) => {
          const url = element.getAttribute("data-attachment-url");
          return sanitizeUrl(url);
        },
        renderHTML: (attributes) => ({
          "data-attachment-url": sanitizeUrl(attributes.url),
        }),
      },
    };
  },

  addCommands() {
    return {
      setAttachment:
        (attrs: AttachmentAttributes) =>
        ({ commands }) =>
          commands.insertContent({
            attrs,
            type: "attachment",
          }),
    };
  },

  addNodeView() {
    // Force the react node view to render immediately using flush sync (https://github.com/ueberdosis/tiptap/blob/b4db352f839e1d82f9add6ee7fb45561336286d8/packages/react/src/ReactRenderer.tsx#L183-L191)
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
  inline: false,
  isolating: true,
  name: "attachment",

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
        "a",
        {
          class: "attachment",
          href: sanitizeUrl(HTMLAttributes["data-attachment-url"]),
          target: "blank",
        },
        `${HTMLAttributes["data-attachment-name"]}`,
      ],
    ];
  },
});
