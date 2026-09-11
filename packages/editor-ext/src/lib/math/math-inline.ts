import { Node, nodeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathInline: {
      setMathInline: () => ReturnType;
    };
  }
}

export interface MathInlineOption {
  HTMLAttributes: Record<string, any>;
  view: any;
}

export interface MathInlineAttributes {
  text: string;
}

export const inputRegex = /(?:^|\s)((?:\$\$)((?:[^$]+))(?:\$\$))$/;

export const MathInline = Node.create<MathInlineOption>({
  addAttributes() {
    return {
      text: {
        default: "",
        parseHTML: (element) => element.innerHTML,
      },
    };
  },

  addCommands() {
    return {
      setMathInline:
        (attributes?: Record<string, any>) =>
        ({ commands }) =>
          commands.insertContent({
            attrs: attributes,
            type: this.name,
          }),
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: inputRegex,
        getAttributes: (match) => ({
          text: match[1].replaceAll("$", ""),
        }),
        type: this.type,
      }),
    ];
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
  group: "inline",
  inline: true,
  name: "mathInline",

  parseHTML() {
    return [
      {
        getAttrs: (node: HTMLElement) =>
          node.hasAttribute("data-katex") ? {} : false,
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      { "data-katex": true, "data-type": this.name },
      `${HTMLAttributes.text}`,
    ];
  },
});
