import type { Editor } from "@tiptap/react";
import React from "react";
import { CellChevron } from "./cell-chevron";
import { ColumnHandle } from "./column-handle";
import { useTableHandleState } from "./hooks/use-table-handle-state";
import { RowHandle } from "./row-handle";

interface TableHandlesLayerProps {
  editor: Editor | null;
}

export const TableHandlesLayer = React.memo(function TableHandlesLayer({
  editor,
}: TableHandlesLayerProps) {
  const state = useTableHandleState(editor);

  if (!(editor && editor.isEditable)) {
    return null;
  }
  if (!(state.hoveringCell && state.tableNode) || state.tablePos == null) {
    return null;
  }

  return (
    <>
      <ColumnHandle
        anchorPos={state.hoveringCell.colFirstCellPos}
        editor={editor}
        index={state.hoveringCell.colIndex}
        tableNode={state.tableNode!}
        tablePos={state.tablePos!}
      />
      <RowHandle
        anchorPos={state.hoveringCell.rowFirstCellPos}
        editor={editor}
        index={state.hoveringCell.rowIndex}
        tableNode={state.tableNode!}
        tablePos={state.tablePos!}
      />
      <CellChevron
        cellPos={state.hoveringCell.cellPos}
        editor={editor}
        tableNode={state.tableNode!}
        tablePos={state.tablePos!}
      />
    </>
  );
});
