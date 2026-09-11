import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { commentDecorationMetaKey, commentMarkClass } from "./comment";

export function commentDecoration(): Plugin {
  const commentDecorationPlugin = new PluginKey("commentDecoration");

  return new Plugin({
    key: commentDecorationPlugin,

    props: {
      decorations: (state) => commentDecorationPlugin.getState(state),
    },
    state: {
      apply(tr, oldSet) {
        const decorationMeta = tr.getMeta(commentDecorationMetaKey);

        if (decorationMeta) {
          const { from, to } = tr.selection;
          const decoration = Decoration.inline(from, to, {
            class: commentMarkClass,
          });
          return DecorationSet.create(tr.doc, [decoration]);
        }
        if (decorationMeta === false) {
          return DecorationSet.empty;
        }

        return oldSet.map(tr.mapping, tr.doc);
      },
      init() {
        return DecorationSet.empty;
      },
    },
  });
}
