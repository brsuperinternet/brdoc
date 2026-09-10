import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const CleanStyles = Extension.create({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("cleanStyles"),
        props: {
          transformPastedHTML(html) {
            return html.replace(/\s+style="[^"]*"/gi, "");
          },
        },
      }),
    ];
  },
  name: "cleanStyles",
  priority: 80,
});
