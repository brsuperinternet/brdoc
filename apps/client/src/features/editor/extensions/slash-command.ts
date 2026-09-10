import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import getSuggestionItems from "@/features/editor/components/slash-menu/menu-items";
import renderItems from "@/features/editor/components/slash-menu/render-items";

export const slashMenuPluginKey = new PluginKey("slash-command");

// @ts-expect-error
const Command = Extension.create({
  addOptions() {
    return {
      suggestion: {
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          // Disable slash menu inside code blocks
          if ($from.parent.type.name === "codeBlock") {
            return false;
          }
          return true;
        },
        char: "/",
        command: ({ editor, range, props }) => {
          props.command({ editor, props, range });
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: slashMenuPluginKey,
        ...this.options.suggestion,
        editor: this.editor,
      }),
    ];
  },
  name: "slash-command",
});

const SlashCommand = Command.configure({
  suggestion: {
    items: getSuggestionItems,
    render: renderItems,
  },
});

export { Command as SlashCommandExtension };
export default SlashCommand;
