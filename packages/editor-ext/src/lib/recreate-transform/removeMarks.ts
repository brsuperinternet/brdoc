import { Node } from "@tiptap/pm/model";
import { Transform } from "@tiptap/pm/transform";

export function removeMarks(doc: Node) {
  const tr = new Transform(doc);
  tr.removeMark(0, doc.nodeSize - 2);
  return tr.doc;
}
