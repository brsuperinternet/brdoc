import { mergeAttributes, Node } from "@tiptap/core";
import { EditorState, NodeSelection, Plugin } from "@tiptap/pm/state";

export interface BaseEmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    baseEmbed: {
      insertBaseEmbed: (attrs: {
        pageId: string | null;
        pendingKey?: string | null;
      }) => ReturnType;
    };
  }
}

export const BaseEmbed = Node.create<BaseEmbedOptions>({
  addAttributes() {
    return {
      pageId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-page-id"),
        renderHTML: (attrs) =>
          attrs.pageId ? { "data-page-id": attrs.pageId } : {},
      },
      // Transient marker set when the slash command inserts the embed
      // before the server has assigned a pageId. The view renders a
      // skeleton in this state. Cleared once the API responds and the
      // real pageId is patched in. Not serialized — embeds saved with
      // a pendingKey would orphan if the page were closed mid-request.
      pendingKey: {
        default: null,
        parseHTML: () => null,
        renderHTML: () => ({}),
      },
    };
  },

  addCommands() {
    return {
      insertBaseEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            attrs,
            type: this.name,
          }),
    };
  },

  addKeyboardShortcuts() {
    // Block Backspace / Delete when the base embed itself is the
    // current selection — the "click on the embed and hit delete"
    // accidental-delete path. Returning true tells TipTap we've
    // handled the key, preventing the default removal. Range
    // selections covering the node and programmatic deletes still
    // work normally.
    const isThisNodeSelected = (): boolean => {
      const { selection } = this.editor.state;
      return (
        selection instanceof NodeSelection &&
        selection.node.type.name === this.name
      );
    };
    return {
      Backspace: () => isThisNodeSelected(),
      Delete: () => isThisNodeSelected(),
    };
  },

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addProseMirrorPlugins() {
    // Same idea as the Backspace/Delete shortcuts above, but for the
    // other accidental-delete path: when the embed is the selection,
    // a typed character or paste would replace the whole node. These
    // hooks return true (handled, no-op) so the node stays put. The
    // user can still press an arrow key to deselect and then type.
    const nodeName = this.name;
    const isThisNodeSelected = (state: EditorState): boolean => {
      const { selection } = state;
      return (
        selection instanceof NodeSelection &&
        selection.node.type.name === nodeName
      );
    };
    return [
      new Plugin({
        props: {
          handlePaste: (view) => isThisNodeSelected(view.state),
          handleTextInput: (view) => isThisNodeSelected(view.state),
        },
      }),
    ];
  },
  atom: true,
  draggable: true,

  // prosemirror-dropcursor draws a block-boundary indicator on every
  // `dragover` it sees. Pragmatic-dnd (used for column / choice reorder
  // inside the embed) fires native `dragstart`/`dragover`, which bubble
  // up to the editor and trigger dropcursor — visible as a stray blue
  // line above or below the embed during an internal drag. The cursor
  // event lands over the atom node, so dropcursor consults
  // `disableDropCursor` on this node spec; returning true suppresses
  // the indicator while still letting pragmatic-dnd handle the drag.
  extendNodeSchema(extension) {
    return extension.name === "base" ? { disableDropCursor: true } : {};
  },
  group: "block",
  name: "base",

  parseHTML() {
    return [{ tag: 'div[data-type="base-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "base-embed",
      }),
    ];
  },
  selectable: true,
});
