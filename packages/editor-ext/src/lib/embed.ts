import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { sanitizeUrl } from "./utils";

export interface EmbedOptions {
  HTMLAttributes: Record<string, any>;
  view: any;
}
export interface EmbedAttributes {
  align?: string;
  height?: number;
  provider: string;
  src?: string;
  width?: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embeds: {
      setEmbed: (attributes?: EmbedAttributes) => ReturnType;
    };
  }
}

export const Embed = Node.create<EmbedOptions>({
  addAttributes() {
    return {
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align"),
        renderHTML: (attributes: EmbedAttributes) => ({
          "data-align": attributes.align,
        }),
      },
      height: {
        default: 600,
        parseHTML: (element) => element.getAttribute("data-height"),
        renderHTML: (attributes: EmbedAttributes) => ({
          "data-height": attributes.height,
        }),
      },
      provider: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-provider"),
        renderHTML: (attributes: EmbedAttributes) => ({
          "data-provider": attributes.provider,
        }),
      },
      src: {
        default: "",
        parseHTML: (element) => {
          const src = element.getAttribute("data-src");
          return sanitizeUrl(src);
        },
        renderHTML: (attributes: EmbedAttributes) => ({
          "data-src": sanitizeUrl(attributes.src),
        }),
      },
      width: {
        default: 800,
        parseHTML: (element) => element.getAttribute("data-width"),
        renderHTML: (attributes: EmbedAttributes) => ({
          "data-width": attributes.width,
        }),
      },
    };
  },

  addCommands() {
    return {
      setEmbed:
        (attrs: EmbedAttributes) =>
        ({ commands }) => {
          // Validate the URL before inserting
          const validatedAttrs = {
            ...attrs,
            src: sanitizeUrl(attrs.src),
          };

          return commands.insertContent({
            attrs: validatedAttrs,
            type: "embed",
          });
        },
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
  name: "embed",

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes["data-src"];
    const safeHref = sanitizeUrl(src);

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
          href: safeHref,
          target: "blank",
        },
        safeHref,
      ],
    ];
  },
});
