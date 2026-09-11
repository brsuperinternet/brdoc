import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { normalizeFileUrl } from "../media-utils";
import { isInternalFileUrl, sanitizeUrl } from "../utils";

export interface AudioOptions {
  HTMLAttributes: Record<string, any>;
  view: any;
}

export interface AudioAttributes {
  attachmentId?: string;
  placeholder?: {
    id: string;
    name: string;
  };
  size?: number;
  src?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audioBlock: {
      setAudio: (attributes: AudioAttributes) => ReturnType;
    };
  }
}

export const TiptapAudio = Node.create<AudioOptions>({
  addAttributes() {
    return {
      attachmentId: {
        default: undefined,
        parseHTML: (element) => element.getAttribute("data-attachment-id"),
        renderHTML: (attributes: AudioAttributes) => ({
          "data-attachment-id": attributes.attachmentId,
        }),
      },
      placeholder: {
        default: null,
        rendered: false,
      },
      size: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-size"),
        renderHTML: (attributes: AudioAttributes) => ({
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
    };
  },

  addCommands() {
    return {
      setAudio:
        (attrs: AudioAttributes) =>
        ({ commands }) =>
          commands.insertContent({
            attrs,
            type: "audio",
          }),
    };
  },

  addNodeView() {
    if (this.options.view) {
      this.editor.isInitialized = true;
      return ReactNodeViewRenderer(this.options.view);
    }

    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement("div");
      const audio = document.createElement("audio");
      const src = node.attrs.src;
      if (src && isInternalFileUrl(src)) {
        audio.src = normalizeFileUrl(src);
      }
      audio.controls = true;
      audio.preload = "metadata";
      audio.style.width = "100%";
      dom.append(audio);
      return { dom };
    };
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
  name: "audio",

  parseHTML() {
    return [
      {
        tag: "audio",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "audio",
      mergeAttributes(
        { controls: "true", preload: "metadata" },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      ["source", { src: HTMLAttributes.src }],
    ];
  },
});
