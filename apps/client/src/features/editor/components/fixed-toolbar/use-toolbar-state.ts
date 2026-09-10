import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";

export interface ToolbarState {
  canRedo: boolean;
  canUndo: boolean;
  isBold: boolean;
  isBulletList: boolean;
  isCode: boolean;
  isItalic: boolean;
  isOrderedList: boolean;
  isStrike: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  isTaskList: boolean;
  isUnderline: boolean;
}

// Undo/redo come from either StarterKit's history or the Yjs collaboration
// history extension. During the brief moment a page is rendered with the
// static editor (mainExtensions only, undoRedo disabled), neither is loaded
// and editor.can().undo/redo is undefined.
function safeCan(editor: Editor, command: "undo" | "redo"): boolean {
  const can = editor?.can() as Record<string, unknown>;
  const fn = can[command];
  return typeof fn === "function" ? (fn as () => boolean)() : false;
}

export function useToolbarState(editor: Editor | null): ToolbarState | null {
  return useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor || ctx.editor.isDestroyed) {
        return null;
      }
      return {
        canRedo: safeCan(ctx.editor, "redo"),
        canUndo: safeCan(ctx.editor, "undo"),
        isBold: ctx.editor.isActive("bold"),
        isBulletList: ctx.editor.isActive("bulletList"),
        isCode: ctx.editor.isActive("code"),
        isItalic: ctx.editor.isActive("italic"),
        isOrderedList: ctx.editor.isActive("orderedList"),
        isStrike: ctx.editor.isActive("strike"),
        isSubscript: ctx.editor.isActive("subscript"),
        isSuperscript: ctx.editor.isActive("superscript"),
        isTaskList: ctx.editor.isActive("taskList"),
        isUnderline: ctx.editor.isActive("underline"),
      };
    },
  });
}
