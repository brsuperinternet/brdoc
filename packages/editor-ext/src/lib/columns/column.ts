import { findParentNode, mergeAttributes, Node } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";

export interface ColumnOptions {
  HTMLAttributes: Record<string, any>;
}

export interface ColumnAttributes {
  width?: number | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    column: {
      setColumnWidth: (width: number | null) => ReturnType;
    };
  }
}

export const Column = Node.create<ColumnOptions>({
  addAttributes() {
    return {
      width: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute("data-width");
          return value ? Number.parseFloat(value) : null;
        },
        renderHTML: (attributes: ColumnAttributes) => {
          if (!attributes.width) {
            return {};
          }
          return {
            "data-width": attributes.width,
            style: `flex: ${attributes.width}`,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setColumnWidth:
        (width) =>
        ({ commands }) =>
          commands.updateAttributes("column", { width }),
    };
  },

  addKeyboardShortcuts() {
    const jumpToColumn = (direction: 1 | -1) => () => {
      const { state, dispatch } = this.editor.view;

      const columns = findParentNode((node) => node.type.name === "columns")(
        state.selection
      );
      if (!columns) {
        return false;
      }

      const column = findParentNode((node) => node.type.name === "column")(
        state.selection
      );
      if (!column) {
        return false;
      }

      let currentIndex = -1;
      columns.node.forEach((_child, offset, index) => {
        if (columns.pos + 1 + offset === column.pos) {
          currentIndex = index;
        }
      });

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= columns.node.childCount) {
        return true;
      }

      let offset = 0;
      for (let j = 0; j < targetIndex; j++) {
        offset += columns.node.child(j).nodeSize;
      }

      const targetPos = columns.pos + 1 + offset + 1 + 1;
      if (dispatch) {
        dispatch(
          state.tr.setSelection(TextSelection.create(state.doc, targetPos))
        );
      }
      return true;
    };

    return {
      "Shift-Tab": jumpToColumn(-1),
      Tab: jumpToColumn(1),
    };
  },

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  content: "block+",
  defining: true,
  group: "block",
  isolating: true,
  name: "column",

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
      0,
    ];
  },
  selectable: false,
});
