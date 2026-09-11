import { Node, nodeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      setMathBlock: () => ReturnType;
    };
  }
}

export interface MathBlockOptions {
  HTMLAttributes: Record<string, any>;
  view: any;
}

export interface MathBlockAttributes {
  text: string;
}

export const inputRegex = /(?:^|\s)((?:\$\$\$)((?:[^$]+))(?:\$\$\$))$/;

export const MathBlock = Node.create({
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
      setMathBlock:
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
  group: "block",
  isolating: true,
  name: "mathBlock",

  parseHTML() {
    return [
      {
        getAttrs: (node: HTMLElement) =>
          node.hasAttribute("data-katex") ? {} : false,
        tag: `div[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-katex": true, "data-type": this.name },
      `${HTMLAttributes.text}`,
    ];
  },
});
