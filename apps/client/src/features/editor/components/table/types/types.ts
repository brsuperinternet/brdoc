import { Editor as CoreEditor } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { Editor } from "@tiptap/react";
import React from "react";

export interface EditorMenuProps {
  appendTo?: React.RefObject<any>;
  editor: Editor;
  shouldHide?: boolean;
}

export interface ShouldShowProps {
  editor?: CoreEditor;
  from?: number;
  oldState?: EditorState;
  state?: EditorState;
  to?: number;
  view: EditorView;
}
