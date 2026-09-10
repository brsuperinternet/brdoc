import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { type RefObject, useEffect, useState } from "react";
import classes from "@/ee/base/styles/kanban.module.css";
import { KANBAN_CARD_DRAG_TYPE } from "@/ee/base/types/base.types";

export function useKanbanCardDnd({
  cardRef,
  rowId,
  columnKey,
  pageId,
}: {
  cardRef: RefObject<HTMLDivElement | null>;
  rowId: string;
  columnKey: string;
  pageId: string;
}): { closestEdge: Edge | null; isDragging: boolean } {
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  useEffect(() => {
    const cardEl = cardRef.current;
    if (!cardEl) {
      return;
    }
    return combine(
      draggable({
        element: cardEl,
        getInitialData: () => ({
          columnKey,
          pageId,
          rowId,
          type: KANBAN_CARD_DRAG_TYPE,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          const width = cardEl.getBoundingClientRect().width;
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: "12px", y: "8px" }),
            nativeSetDragImage,
            render: ({ container }) => {
              const card = document.createElement("div");
              card.className = classes.cardDragPreview;
              card.style.width = `${width}px`;
              const clone = cardEl.cloneNode(true) as HTMLElement;
              clone.style.opacity = "1";
              card.appendChild(clone);
              container.appendChild(card);
            },
          });
        },
      }),
      dropTargetForElements({
        canDrop: ({ source }) =>
          source.data.type === KANBAN_CARD_DRAG_TYPE &&
          source.data.pageId === pageId,
        element: cardEl,
        getData: ({ input, element }) =>
          attachClosestEdge(
            { columnKey, rowId },
            { allowedEdges: ["top", "bottom"], element, input }
          ),
        onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      })
    );
  }, [cardRef, rowId, columnKey, pageId]);

  return { closestEdge, isDragging };
}
