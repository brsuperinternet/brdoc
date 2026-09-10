import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { type RefObject, useEffect, useState } from "react";
import { KANBAN_COLUMN_DRAG_TYPE } from "@/ee/base/types/base.types";

export function useKanbanColumnDnd({
  headerRef,
  handleRef,
  columnKey,
  pageId,
}: {
  headerRef: RefObject<HTMLDivElement | null>;
  handleRef: RefObject<HTMLDivElement | null>;
  columnKey: string;
  pageId: string;
}): { closestEdge: Edge | null; isDragging: boolean } {
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const headerEl = headerRef.current;
    const handleEl = handleRef.current;
    if (!(headerEl && handleEl)) {
      return;
    }
    return combine(
      draggable({
        dragHandle: handleEl,
        element: headerEl,
        getInitialData: () => ({
          columnKey,
          pageId,
          type: KANBAN_COLUMN_DRAG_TYPE,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        canDrop: ({ source }) =>
          source.data.type === KANBAN_COLUMN_DRAG_TYPE &&
          source.data.pageId === pageId &&
          source.data.columnKey !== columnKey,
        element: headerEl,
        getData: ({ input, element }) =>
          attachClosestEdge(
            { columnKey },
            { allowedEdges: ["left", "right"], element, input }
          ),
        onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      })
    );
  }, [headerRef, handleRef, columnKey, pageId]);

  return { closestEdge, isDragging };
}
