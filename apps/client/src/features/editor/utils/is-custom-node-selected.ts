import { CodeBlock } from "@tiptap/extension-code-block";
import TiptapLink from "@tiptap/extension-link";
import { Editor } from "@tiptap/react";

export const isCustomNodeSelected = (editor: Editor, node: HTMLElement) => {
  const customNodes = [CodeBlock.name, TiptapLink.name];

  return customNodes.some((type) => editor.isActive(type));
};

export default isCustomNodeSelected;
