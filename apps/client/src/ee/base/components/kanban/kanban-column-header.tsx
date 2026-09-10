import { ActionIcon, Text } from "@mantine/core";
import { IconGripVertical, IconPlus } from "@tabler/icons-react";
import clsx from "clsx";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { choiceColor } from "@/ee/base/components/cells/choice-color";
import { BaseDropEdgeIndicator } from "@/ee/base/components/grid/base-drop-edge-indicator";
import { KanbanColumnMenu } from "@/ee/base/components/kanban/kanban-column-menu";
import { KanbanColumnTitle } from "@/ee/base/components/kanban/kanban-column-title";
import { useKanbanColumnDnd } from "@/ee/base/hooks/use-kanban-column-dnd";
import classes from "@/ee/base/styles/kanban.module.css";
import { IBaseProperty, KanbanColumn } from "@/ee/base/types/base.types";

type KanbanColumnHeaderProps = {
  column: KanbanColumn;
  pageId: string;
  property: IBaseProperty | undefined;
  count?: string;
  canEdit: boolean;
  onHide: () => void;
  onAddCard: () => void;
};

export function KanbanColumnHeader({
  column,
  pageId,
  property,
  count,
  canEdit,
  onHide,
  onAddCard,
}: KanbanColumnHeaderProps) {
  const { t } = useTranslation();
  const dotColor = column.color
    ? (choiceColor(column.color).color as string)
    : "light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-3))";

  const headerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const { closestEdge, isDragging } = useKanbanColumnDnd({
    columnKey: column.key,
    handleRef,
    headerRef,
    pageId,
  });

  return (
    <div
      className={clsx(
        classes.columnHeader,
        isDragging && classes.columnHeaderDragging
      )}
      ref={headerRef}
    >
      {canEdit && (
        <div aria-hidden className={classes.columnDragHandle} ref={handleRef}>
          <IconGripVertical size={14} />
        </div>
      )}
      <div
        style={{
          background: dotColor,
          borderRadius: "50%",
          flexShrink: 0,
          height: 8,
          width: 8,
        }}
      />
      <KanbanColumnTitle
        canEdit={canEdit}
        column={column}
        pageId={pageId}
        property={property}
      />
      {count !== undefined && <Text className={classes.count}>{count}</Text>}
      {canEdit && (
        <>
          {property && (
            <KanbanColumnMenu
              onHide={onHide}
              pageId={pageId}
              property={property}
            />
          )}
          <ActionIcon
            aria-label={t("Add card")}
            color="gray"
            onClick={onAddCard}
            size="sm"
            variant="subtle"
          >
            <IconPlus size={14} />
          </ActionIcon>
        </>
      )}
      {closestEdge && <BaseDropEdgeIndicator edge={closestEdge} />}
    </div>
  );
}
