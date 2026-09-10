import {
  Divider,
  Group,
  Popover,
  Stack,
  Switch,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { Table } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useEscapeClose } from "@/ee/base/hooks/use-escape-close";
import { propertyTypes } from "@/ee/base/property-types/property-type.registry";
import cellClasses from "@/ee/base/styles/cells.module.css";
import viewClasses from "@/ee/base/styles/views.module.css";
import { IBaseProperty, IBaseRow } from "@/ee/base/types/base.types";

type ViewPropertyVisibilityProps = {
  opened: boolean;
  onClose: () => void;
  table: Table<IBaseRow>;
  properties: IBaseProperty[];
  onPersist: () => void;
  children: React.ReactNode;
};

export function ViewPropertyVisibility({
  opened,
  onClose,
  table,
  properties,
  onPersist,
  children,
}: ViewPropertyVisibilityProps) {
  const { t } = useTranslation();
  useEscapeClose(opened, onClose);

  const columns = useMemo(
    () => table.getAllLeafColumns().filter((col) => col.id !== "__row_number"),
    [table, properties]
  );

  const allVisible = columns.every((col) => col.getIsVisible());
  const noneVisible = columns
    .filter((col) => col.getCanHide())
    .every((col) => !col.getIsVisible());

  const handleToggle = useCallback(
    (columnId: string, visible: boolean) => {
      const col = table.getColumn(columnId);
      if (!col) {
        return;
      }
      col.toggleVisibility(visible);
      onPersist();
    },
    [table, onPersist]
  );

  const handleShowAll = useCallback(() => {
    columns.forEach((col) => {
      if (col.getCanHide()) {
        col.toggleVisibility(true);
      }
    });
    onPersist();
  }, [columns, onPersist]);

  const handleHideAll = useCallback(() => {
    columns.forEach((col) => {
      if (col.getCanHide()) {
        col.toggleVisibility(false);
      }
    });
    onPersist();
  }, [columns, onPersist]);

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
              {t("Properties")}
            </Text>
            <Group gap={8}>
              <UnstyledButton
                disabled={allVisible}
                onClick={handleShowAll}
                style={{ opacity: allVisible ? 0.4 : 1 }}
              >
                <Text c="blue" size="xs">
                  {t("Show all")}
                </Text>
              </UnstyledButton>
              <UnstyledButton
                disabled={noneVisible}
                onClick={handleHideAll}
                style={{ opacity: noneVisible ? 0.4 : 1 }}
              >
                <Text c="blue" size="xs">
                  {t("Hide all")}
                </Text>
              </UnstyledButton>
            </Group>
          </Group>

          <Divider />

          <Stack gap={0}>
            {columns.map((col) => {
              const property = col.columnDef.meta?.property as
                | IBaseProperty
                | undefined;
              if (!property) {
                return null;
              }

              const canHide = col.getCanHide();
              const isVisible = col.getIsVisible();
              const typeConfig = propertyTypes.find(
                (pt) => pt.type === property.type
              );
              const TypeIcon = typeConfig?.icon;

              return (
                <UnstyledButton
                  aria-checked={isVisible}
                  aria-disabled={!canHide || undefined}
                  className={cellClasses.menuItem}
                  key={col.id}
                  onClick={() => {
                    if (canHide) {
                      handleToggle(col.id, !isVisible);
                    }
                  }}
                  role="switch"
                  style={{ opacity: canHide ? 1 : 0.5 }}
                >
                  <Group gap={8} style={{ flex: 1 }} wrap="nowrap">
                    {TypeIcon && (
                      <TypeIcon size={14} style={{ flexShrink: 0 }} />
                    )}
                    <Text className={viewClasses.fieldNameText} size="sm">
                      {property.name}
                    </Text>
                  </Group>
                  <Switch
                    aria-hidden
                    checked={isVisible}
                    disabled={!canHide}
                    onChange={() => {}}
                    // Clicking the track synthesizes a second click on the hidden input which bubbles
                    // to UnstyledButton, firing handleToggle twice. stopPropagation blocks only that
                    // synthetic input click so handleToggle fires exactly once.
                    onClick={(e) => e.stopPropagation()}
                    size="xs"
                    styles={{
                      track: { cursor: canHide ? "pointer" : "not-allowed" },
                    }}
                    tabIndex={-1}
                  />
                </UnstyledButton>
              );
            })}
          </Stack>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
