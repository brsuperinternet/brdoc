import { Editor, Node } from "@tiptap/core";
import { GapCursor } from "@tiptap/pm/gapcursor";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { StarterKit } from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";
import { TiptapDocument } from "./document";

const Footnotes = Node.create({
  content: "paragraph*",
  group: "",
  isolating: true,
  name: "footnotes",
  renderHTML() {
    return ["ol", { class: "footnotes" }, 0];
  },
});

const AtomBlock = Node.create({
  atom: true,
  group: "block",
  name: "atomBlock",
  renderHTML() {
    return ["div", { "data-atom-block": "" }];
  },
});

const IsolatingBlock = Node.create({
  content: "paragraph+",
  group: "block",
  isolating: true,
  name: "isolatingBlock",
  renderHTML() {
    return ["div", { "data-isolating-block": "" }, 0];
  },
});

function createEditor(content: object[]) {
  const element = document.createElement("div");
  document.body.appendChild(element);

  return new Editor({
    content: { content, type: "doc" },
    element,
    extensions: [
      TiptapDocument,
      StarterKit.configure({ document: false }),
      Footnotes,
      AtomBlock,
      IsolatingBlock,
    ],
  });
}

function pressKey(editor: Editor, key: string, keyCode: number) {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      keyCode,
    })
  );
}

describe("TiptapDocument", () => {
  it("stops on the gap when arrowing down from a selected block node", () => {
    const editor = createEditor([
      { type: "atomBlock" },
      { type: "atomBlock" },
      { type: "paragraph" },
    ]);
    const gapPos = editor.state.doc.child(0).nodeSize;
    editor.view.dispatch(
      editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0))
    );

    pressKey(editor, "ArrowDown", 40);

    expect(editor.state.selection).toBeInstanceOf(GapCursor);
    expect(editor.state.selection.head).toBe(gapPos);

    editor.destroy();
  });

  it("stops on the gap when arrowing right out of an isolating block", () => {
    const paragraph = (text: string) => ({
      content: [{ text, type: "text" }],
      type: "paragraph",
    });
    const editor = createEditor([
      { content: [paragraph("a")], type: "isolatingBlock" },
      { content: [paragraph("b")], type: "isolatingBlock" },
      { type: "paragraph" },
    ]);
    const gapPos = editor.state.doc.child(0).nodeSize;
    const endOfFirstText = gapPos - 2;
    editor.view.dispatch(
      editor.state.tr.setSelection(
        TextSelection.create(editor.state.doc, endOfFirstText)
      )
    );

    pressKey(editor, "ArrowRight", 39);

    expect(editor.state.selection).toBeInstanceOf(GapCursor);
    expect(editor.state.selection.head).toBe(gapPos);

    editor.destroy();
  });
});
