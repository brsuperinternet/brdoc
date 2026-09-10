import { Table } from "@tanstack/react-table";
import { GridContainer } from "@/ee/base/components/grid/grid-container";
import { IBase, IBaseRow, IBaseView } from "@/ee/base/types/base.types";

type BaseTableProps = {
  base: IBase;
  rows: IBaseRow[];
  effectiveView: IBaseView | undefined;
  table: Table<IBaseRow>;
  pageId: string;
  embedded?: boolean;
  isFiltered: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
  onCellUpdate: (rowId: string, propertyId: string, value: unknown) => void;
  onAddRow: (afterRowId?: string, focusPropertyId?: string) => void;
  onColumnReorder: (columnId: string, finishIndex: number) => void;
  onResizeEnd: () => void;
  onRowReorder: (
    rowId: string,
    targetRowId: string,
    dropPosition: "above" | "below"
  ) => void;
  persistViewConfig: () => void;
  scrollportRef: React.RefObject<HTMLDivElement>;
  aboveBand?: React.ReactNode;
};

export function BaseTable({
  base,
  rows: _rows,
  table,
  pageId,
  embedded,
  isFiltered,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  onCellUpdate,
  onAddRow,
  onColumnReorder,
  onResizeEnd,
  onRowReorder,
  scrollportRef,
  aboveBand,
}: BaseTableProps) {
  return (
    <GridContainer
      aboveBand={aboveBand ?? null}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isFiltered={isFiltered}
      onAddRow={onAddRow}
      onCellUpdate={onCellUpdate}
      onColumnReorder={onColumnReorder}
      onFetchNextPage={onFetchNextPage}
      onResizeEnd={onResizeEnd}
      onRowReorder={onRowReorder}
      pageId={pageId}
      properties={base.properties}
      scrollElement={embedded ? window : scrollportRef.current}
      table={table}
    />
  );
}
