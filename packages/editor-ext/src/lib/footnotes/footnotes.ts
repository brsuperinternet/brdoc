//Source MIT - https://github.com/buttondown/tiptap-footnotes
import OrderedList from "@tiptap/extension-ordered-list";
import FootnoteRules from "./rules";

const Footnotes = OrderedList.extend({
  addAttributes() {
    return {
      class: {
        default: "footnotes",
      },
    };
  },
  addCommands() {
    return {};
  },

  addExtensions() {
    return [FootnoteRules];
  },
  addInputRules() {
    return [];
  },

  addKeyboardShortcuts() {
    return {};
  },

  content() {
    return "footnote*";
  },
  defining: true,
  draggable: false,
  group: "", // removed the default group of the ordered list extension
  isolating: true,
  name: "footnotes",
  parseHTML() {
    return [
      {
        priority: 1000,
        tag: "ol.footnotes",
      },
    ];
  },
});

export default Footnotes;
