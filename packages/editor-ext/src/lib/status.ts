import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

export type StatusStorage = {
  autoOpen: boolean;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    status: {
      setStatus: (attributes?: { text?: string; color?: string }) => ReturnType;
    };
  }

  interface Storage {
    status: StatusStorage;
  }
}

export type StatusColor =
  | "gray"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "purple";

export interface StatusOption {
  HTMLAttributes: Record<string, any>;
  view: any;
}

export const Status = Node.create<StatusOption, StatusStorage>({
  addAttributes() {
    return {
      color: {
        default: "gray",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-color") || "gray",
      },
      text: {
        default: "",
        parseHTML: (element: HTMLElement) => element.textContent || "",
      },
    };
  },

  addCommands() {
    return {
      setStatus:
        (attributes) =>
        ({ commands }) => {
          this.storage.autoOpen = true;
          return commands.insertContent({
            attrs: {
              color: attributes?.color || "gray",
              text: attributes?.text ?? "",
            },
            type: this.name,
          });
        },
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

  addStorage() {
    return {
      autoOpen: false,
    };
  },
  atom: true,
  draggable: true,
  group: "inline",
  inline: true,
  name: "status",

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      {
        "data-color": HTMLAttributes.color,
        "data-type": this.name,
      },
      HTMLAttributes.text,
    ];
  },
  selectable: true,
});
