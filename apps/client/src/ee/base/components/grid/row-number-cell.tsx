import { Checkbox } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";
import { type PrimitiveAtom, useAtomValue, useSetAtom } from "jotai";
import { selectAtom } from "jotai/utils";
import { memo, useCallback, useMemo } from "react";
import { focusedCellAtomFamily } from "@/ee/base/atoms/base-atoms";
import { useBaseEditable } from "@/ee/base/context/base-editable";
import { useGridRowOrder } from "@/ee/base/context/grid-row-order";
import { useRowSelection } from "@/ee/base/hooks/use-row-selection";
import classes from "@/ee/base/styles/grid.module.css";
import { FocusedCell } from "@/ee/base/types/base.types";

type RowNumberCellProps = {
  rowId: string;
  rowIndex: number;
  isPinned: boolean;
  pinOffset?: number;
  pageId: string;
};

export const RowNumberCell = memo(function RowNumberCell({
  rowId,
  rowIndex,
  isPinned,
  pinOffset,
  pageId,
}: RowNumberCellProps) {
  const { isSelected, toggle } = useRowSelection(pageId);
  const selected = isSelected(rowId);
  const editable = useBaseEditable();
  const getOrderedRowIds = useGridRowOrder();

  const setFocusedCell = useSetAtom(
    focusedCellAtomFamily(pageId) as PrimitiveAtom<FocusedCell>
  );
  const isFocused = useAtomValue(
    useMemo(
      () =>
        selectAtom(
          focusedCellAtomFamily(pageId),
          (fc) => fc?.rowId === rowId && fc?.propertyId === "__row_number"
        ),
      [pageId, rowId]
    )
  );

  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) {
        return;
      }
      setFocusedCell({ propertyId: "__row_number", rowId });
    },
    [rowId, setFocusedCell]
  );

  const handleCellClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setFocusedCell({ propertyId: "__row_number", rowId });
      (e.currentTarget.closest('[role="grid"]') as HTMLElement | null)?.focus({
        preventScroll: true,
      });
    },
    [rowId, setFocusedCell]
  );

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nativeEvent = e.nativeEvent as MouseEvent;
      toggle(rowId, {
        orderedRowIds: getOrderedRowIds(),
        rowIndex,
        shiftKey: nativeEvent.shiftKey === true,
      });
    },
    [rowId, rowIndex, getOrderedRowIds, toggle]
  );

  return (
    <div
      className={`${classes.cell} ${classes.rowNumberCell} ${isPinned ? classes.cellPinned : ""} ${isFocused ? classes.cellFocused : ""}`}
      id={`base-cell-${rowId}-__row_number`}
      onClick={handleCellClick}
      onMouseDown={handleCellMouseDown}
      role="gridcell"
      style={
        isPinned
          ? ({ "--pin-offset": `${pinOffset ?? 0}px` } as React.CSSProperties)
          : undefined
      }
    >
      <div className={classes.rowNumberCellInner}>
        {editable && (
          <span aria-label="Drag row" className={classes.rowNumberDragHandle}>
            <IconGripVertical size={12} />
          </span>
        )}
        {editable && (
          <span className={classes.rowNumberCheckbox}>
            <Checkbox
              aria-label="Select row"
              checked={selected}
              onChange={handleCheckboxChange}
              size="xs"
              tabIndex={-1}
            />
          </span>
        )}
        <span className={classes.rowNumberIndex}>{rowIndex + 1}</span>
      </div>
    </div>
  );
});
