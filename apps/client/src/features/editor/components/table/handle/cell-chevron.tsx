import { isCellSelection, isEditorReady } from "@docmost/editor-ext";
import { autoUpdate, hide, offset, useFloating } from "@floating-ui/react";
import { Menu, UnstyledButton } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { columnResizingPluginKey } from "@tiptap/pm/tables";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import clsx from "clsx";
import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import classes from "./handle.module.css";
import { CellChevronMenu } from "./menus/cell-chevron-menu";

interface CellChevronProps {
  cellPos: number;
  editor: Editor;
  tableNode: ProseMirrorNode;
  tablePos: number;
}

export const CellChevron = React.memo(function CellChevron({
  editor,
  cellPos,
  tableNode,
  tablePos,
}: CellChevronProps) {
  const { t } = useTranslation();
  const cellDom = isEditorReady(editor)
    ? (editor.view.nodeDOM(cellPos) as HTMLElement | null)
    : null;

  const { refs, floatingStyles, middlewareData } = useFloating({
    // crossAxis pulls the chevron INWARD from the cell's right edge. We need
    // enough inset that we don't overlap PM-tables' column-resize hot zone
    // (~5px wide around the column boundary). Without this, hovering near the
    // column edge picks up the chevron's `cursor: pointer` instead of
    // `col-resize`, and a drag near the edge clicks the chevron.
    middleware: [offset({ crossAxis: -10, mainAxis: -22 }), hide()],
    placement: "top-end",
    strategy: "absolute",
    whileElementsMounted: autoUpdate,
  });
  const isReferenceHidden = !!middlewareData.hide?.referenceHidden;

  useEffect(() => {
    refs.setReference(cellDom);
  }, [cellDom, refs]);

  // Hide the chevron while the user is resizing a column. PM-tables sets
  // `activeHandle > -1` whenever the mouse is near a column boundary OR
  // actively dragging it. Either way we don't want the chevron in the way.
  const isResizingColumn = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return false;
      }
      const state = columnResizingPluginKey.getState(ctx.editor.state) as
        | { activeHandle: number }
        | undefined;
      return !!state && state.activeHandle > -1;
    },
  });

  const onOpen = useCallback(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    const current = editor.state.selection;

    // Preserve an existing multi-cell CellSelection that already covers
    // this cell so merge etc. operate on the user's whole range.
    let preserveExisting = false;
    if (isCellSelection(current)) {
      current.forEachCell((_node, pos) => {
        if (pos === cellPos) {
          preserveExisting = true;
        }
      });
    }

    if (!preserveExisting) {
      // Drop a collapsed cursor inside the cell rather than a single-cell
      // CellSelection — PM-tables paints the latter as a text-range
      // highlight on the cell content.
      try {
        const $inside = editor.state.doc.resolve(cellPos + 1);
        const sel = TextSelection.near($inside, 1);
        editor.view.dispatch(editor.state.tr.setSelection(sel));
      } catch {}
    }
    editor.commands.freezeHandles();
  }, [editor, cellPos]);

  const onClose = useCallback(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    editor.commands.unfreezeHandles();
  }, [editor]);

  if (!cellDom) {
    return null;
  }
  if (isResizingColumn) {
    return null;
  }

  return (
    <Menu
      onClose={onClose}
      onOpen={onOpen}
      position="bottom-end"
      shadow="md"
      withinPortal
    >
      <Menu.Target>
        <UnstyledButton
          aria-label={t("Cell actions")}
          className={clsx(classes.cellChevron)}
          ref={refs.setFloating}
          style={{
            ...floatingStyles,
            ...(isReferenceHidden ? { visibility: "hidden" as const } : {}),
          }}
        >
          <IconChevronDown size={14} />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <CellChevronMenu
          cellPos={cellPos}
          editor={editor}
          tableNode={tableNode}
          tablePos={tablePos}
        />
      </Menu.Dropdown>
    </Menu>
  );
});
