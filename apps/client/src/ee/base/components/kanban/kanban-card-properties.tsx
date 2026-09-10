import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { getReorderDestinationIndex } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index";
import {
  Group,
  Popover,
  ScrollArea,
  Stack,
  Switch,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconGripVertical, type IconLetterT } from "@tabler/icons-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { BaseDropEdgeIndicator } from "@/ee/base/components/grid/base-drop-edge-indicator";
import { propertyTypes } from "@/ee/base/property-types/property-type.registry";
import { useUpdateViewMutation } from "@/ee/base/queries/base-view-query";
import cellClasses from "@/ee/base/styles/cells.module.css";
import propClasses from "@/ee/base/styles/property.module.css";
import { IBase, IBaseProperty, IBaseView } from "@/ee/base/types/base.types";

const DRAG_TYPE = "base-card-property";

type KanbanCardPropertiesProps = {
  opened: boolean;
  onClose: () => void;
  base: IBase;
  view: IBaseView;
  pageId: string;
  children: React.ReactNode;
};

export function KanbanCardProperties({
  opened,
  onClose,
  base,
  view,
  pageId,
  children,
}: KanbanCardPropertiesProps) {
  const { t } = useTranslation();
  const updateView = useUpdateViewMutation();

  const nonPrimaryProperties = base.properties.filter((p) => !p.isPrimary);
  const visibleIds = view.config?.visiblePropertyIds ?? [];

  const savedOrder = view.config?.propertyOrder ?? [];
  const orderedProperties = [
    ...savedOrder
      .map((id) => nonPrimaryProperties.find((p) => p.id === id))
      .filter((p): p is IBaseProperty => p !== undefined),
    ...nonPrimaryProperties.filter((p) => !savedOrder.includes(p.id)),
  ];

  const primaryProperty = base.properties.find((p) => p.isPrimary);
  const PrimaryIcon = primaryProperty
    ? propertyTypes.find((pt) => pt.type === primaryProperty.type)?.icon
    : undefined;

  const handleToggle = useCallback(
    (propertyId: string, checked: boolean) => {
      const next = checked
        ? [...visibleIds, propertyId]
        : visibleIds.filter((id) => id !== propertyId);
      updateView.mutate({
        config: { visiblePropertyIds: next },
        pageId,
        viewId: view.id,
      });
    },
    [updateView, view.id, visibleIds, pageId]
  );

  const handleReorder = useCallback(
    (activeId: string, targetId: string, edge: Edge) => {
      const startIndex = orderedProperties.findIndex((p) => p.id === activeId);
      const indexOfTarget = orderedProperties.findIndex(
        (p) => p.id === targetId
      );
      if (startIndex === -1 || indexOfTarget === -1) {
        return;
      }
      const finishIndex = getReorderDestinationIndex({
        axis: "vertical",
        closestEdgeOfTarget: edge,
        indexOfTarget,
        startIndex,
      });
      if (finishIndex === startIndex) {
        return;
      }
      const reordered = reorder({
        finishIndex,
        list: orderedProperties,
        startIndex,
      });
      updateView.mutate({
        config: { propertyOrder: reordered.map((p) => p.id) },
        pageId,
        viewId: view.id,
      });
    },
    [orderedProperties, updateView, view.id, pageId]
  );

  return (
    <Popover
      closeOnClickOutside
      closeOnEscape
      onChange={(o) => {
        if (!o) {
          onClose();
        }
      }}
      onClose={onClose}
      opened={opened}
      position="bottom-end"
      shadow="md"
      trapFocus
      width={260}
      withinPortal
    >
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown p="xs">
        <Stack gap={4}>
          <Group justify="space-between" px={4} py={2}>
            <Text c="dimmed" fw={600} size="xs">
              {t("Card properties")}
            </Text>
          </Group>
          <ScrollArea.Autosize
            mah="min(60vh, 420px)"
            offsetScrollbars
            scrollbarSize={6}
          >
            <Stack gap={0}>
              {primaryProperty && (
                <div
                  className={cellClasses.menuItem}
                  style={{ cursor: "default", paddingLeft: 4 }}
                >
                  <div
                    className={propClasses.dragHandle}
                    style={{ visibility: "hidden" }}
                  >
                    <IconGripVertical size={14} />
                  </div>
                  <Group gap={8} style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
                    {PrimaryIcon && (
                      <PrimaryIcon size={14} style={{ flexShrink: 0 }} />
                    )}
                    <Text
                      size="sm"
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {primaryProperty.name}
                    </Text>
                  </Group>
                  <Switch
                    checked
                    disabled
                    onChange={() => {}}
                    size="xs"
                    styles={{ track: { cursor: "default" } }}
                  />
                </div>
              )}
              {orderedProperties.map((p) => {
                const isVisible = visibleIds.includes(p.id);
                const typeConfig = propertyTypes.find(
                  (pt) => pt.type === p.type
                );
                const TypeIcon = typeConfig?.icon;
                return (
                  <SortablePropertyRow
                    isVisible={isVisible}
                    key={p.id}
                    onReorder={handleReorder}
                    onToggle={handleToggle}
                    property={p}
                    TypeIcon={TypeIcon}
                  />
                );
              })}
            </Stack>
          </ScrollArea.Autosize>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

type SortablePropertyRowProps = {
  property: IBaseProperty;
  isVisible: boolean;
  TypeIcon: typeof IconLetterT | undefined;
  onToggle: (propertyId: string, checked: boolean) => void;
  onReorder: (activeId: string, targetId: string, edge: Edge) => void;
};

function SortablePropertyRow({
  property,
  isVisible,
  TypeIcon,
  onToggle,
  onReorder,
}: SortablePropertyRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  const onReorderRef = useRef(onReorder);
  useLayoutEffect(() => {
    onReorderRef.current = onReorder;
  });

  useEffect(() => {
    const row = rowRef.current;
    const handle = handleRef.current;
    if (!(row && handle)) {
      return;
    }
    return combine(
      draggable({
        dragHandle: handle,
        element: row,
        getInitialData: () => ({ propertyId: property.id, type: DRAG_TYPE }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        canDrop: ({ source }) =>
          source.data.type === DRAG_TYPE &&
          source.data.propertyId !== property.id,
        element: row,
        getData: ({ input, element }) =>
          attachClosestEdge(
            { propertyId: property.id },
            { allowedEdges: ["top", "bottom"], element, input }
          ),
        onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setClosestEdge(null),
        onDrop: ({ source, self }) => {
          setClosestEdge(null);
          const edge = extractClosestEdge(self.data);
          if (!edge) {
            return;
          }
          onReorderRef.current(
            source.data.propertyId as string,
            property.id,
            edge
          );
        },
      })
    );
  }, [property.id]);

  return (
    <div
      ref={rowRef}
      style={{ opacity: isDragging ? 0.4 : 1, position: "relative" }}
    >
      <UnstyledButton
        className={cellClasses.menuItem}
        onClick={() => onToggle(property.id, !isVisible)}
        style={{ paddingLeft: 4 }}
      >
        <div
          className={propClasses.dragHandle}
          onClick={(e) => e.stopPropagation()}
          ref={handleRef}
        >
          <IconGripVertical size={14} style={{ opacity: 0.4 }} />
        </div>
        <Group gap={8} style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
          {TypeIcon && <TypeIcon size={14} style={{ flexShrink: 0 }} />}
          <Text
            size="sm"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {property.name}
          </Text>
        </Group>
        <Switch
          checked={isVisible}
          onChange={() => {}}
          onClick={(e) => e.stopPropagation()}
          size="xs"
          styles={{ track: { cursor: "pointer" } }}
        />
      </UnstyledButton>
      {closestEdge && <BaseDropEdgeIndicator edge={closestEdge} />}
    </div>
  );
}
