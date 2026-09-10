import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { generateJitteredKeyBetween } from "fractional-indexing-jittered";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { KanbanAddCardButton } from "@/ee/base/components/kanban/kanban-add-card-button";
import { KanbanCard } from "@/ee/base/components/kanban/kanban-card";
import { KanbanColumnHeader } from "@/ee/base/components/kanban/kanban-column-header";
import { useKanbanColumnAutoScroll } from "@/ee/base/hooks/use-kanban-autoscroll";
import {
  useBaseRowsQuery,
  useKanbanCreateCardMutation,
} from "@/ee/base/queries/base-row-query";
import { formatKanbanCount } from "@/ee/base/services/format-kanban-count";
import { buildColumnFilter } from "@/ee/base/services/kanban-column-filter";
import classes from "@/ee/base/styles/kanban.module.css";
import {
  type FilterGroup,
  type IBase,
  type IBaseProperty,
  type IBaseRow,
  type IBaseView,
  KANBAN_CARD_DRAG_TYPE,
  type KanbanColumn as KanbanColumnType,
} from "@/ee/base/types/base.types";

type KanbanColumnProps = {
  base: IBase;
  view: IBaseView;
  pageId: string;
  column: KanbanColumnType;
  viewFilter: FilterGroup | undefined;
  groupByPropertyId: string;
  groupByProperty: IBaseProperty | undefined;
  canEdit: boolean;
  onOpenRow: (rowId: string) => void;
  onHide: (columnKey: string) => void;
  registerCardRef: (
    rowId: string,
    columnKey: string,
    el: HTMLDivElement | null
  ) => void;
  registerColumnRows: (columnKey: string, rows: IBaseRow[]) => void;
};

export function KanbanColumn({
  base,
  view,
  pageId,
  column,
  viewFilter,
  groupByPropertyId,
  groupByProperty,
  canEdit,
  onOpenRow,
  onHide,
  registerCardRef,
  registerColumnRows,
}: KanbanColumnProps) {
  const filter = useMemo(
    () => buildColumnFilter(viewFilter, groupByPropertyId, column.key),
    [viewFilter, groupByPropertyId, column.key]
  );

  const rowsQuery = useBaseRowsQuery(pageId, filter, undefined);
  const createCard = useKanbanCreateCardMutation();

  const rows = useMemo(() => {
    const pages = rowsQuery.data?.pages ?? [];
    const seen = new Set<string>();
    const flat: IBaseRow[] = [];
    for (const page of pages) {
      for (const row of page.items) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          flat.push(row);
        }
      }
    }
    return flat
      .slice()
      .sort((a, b) =>
        a.position < b.position ? -1 : a.position > b.position ? 1 : 0
      );
  }, [rowsQuery.data]);

  const count = rowsQuery.isSuccess
    ? formatKanbanCount(rows.length, rowsQuery.hasNextPage ?? false)
    : undefined;

  useEffect(() => {
    registerColumnRows(column.key, rows);
  }, [column.key, rows, registerColumnRows]);

  const listRef = useRef<HTMLDivElement>(null);
  useKanbanColumnAutoScroll(listRef, pageId);

  const pendingScrollRef = useRef<"top" | "bottom" | null>(null);

  useEffect(() => {
    const placement = pendingScrollRef.current;
    if (!placement) {
      return;
    }
    pendingScrollRef.current = null;
    const el = listRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = placement === "top" ? 0 : el.scrollHeight;
  }, [rows]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) {
      return;
    }
    return dropTargetForElements({
      canDrop: ({ source }) =>
        source.data.type === KANBAN_CARD_DRAG_TYPE &&
        source.data.pageId === pageId,
      element: listEl,
      getData: () => ({ columnKey: column.key, isColumnBody: true }),
    });
  }, [column.key, pageId]);

  const onScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    const { scrollHeight, scrollTop, clientHeight } = el;
    if (
      scrollHeight - scrollTop - clientHeight < 200 &&
      rowsQuery.hasNextPage &&
      !rowsQuery.isFetchingNextPage
    ) {
      rowsQuery.fetchNextPage();
    }
  }, [
    rowsQuery.hasNextPage,
    rowsQuery.isFetchingNextPage,
    rowsQuery.fetchNextPage,
  ]);

  const addCard = useCallback(
    (placement: "top" | "bottom") => {
      let position: string | undefined;
      try {
        position =
          placement === "top"
            ? generateJitteredKeyBetween(null, rows[0]?.position ?? null)
            : generateJitteredKeyBetween(
                rows[rows.length - 1]?.position ?? null,
                null
              );
      } catch {
        position = undefined;
      }
      createCard.mutate(
        {
          columnKey: column.key,
          destColumnFilter: filter,
          groupByPropertyId,
          pageId,
          position,
        },
        {
          onSuccess: (newRow) => {
            pendingScrollRef.current = placement;
            onOpenRow(newRow.id);
          },
        }
      );
    },
    [createCard, pageId, filter, groupByPropertyId, column.key, onOpenRow, rows]
  );

  return (
    <div className={classes.column} data-column-key={column.key}>
      <KanbanColumnHeader
        canEdit={canEdit}
        column={column}
        count={count}
        onAddCard={() => addCard("top")}
        onHide={() => onHide(column.key)}
        pageId={pageId}
        property={groupByProperty}
      />
      <div className={classes.cardList} onScroll={onScroll} ref={listRef}>
        {rows.map((row) => (
          <KanbanCard
            base={base}
            columnKey={column.key}
            key={row.id}
            onOpen={onOpenRow}
            ref={(el) => registerCardRef(row.id, column.key, el)}
            row={row}
            view={view}
          />
        ))}
        {canEdit && <KanbanAddCardButton onAddCard={() => addCard("bottom")} />}
      </div>
    </div>
  );
}
