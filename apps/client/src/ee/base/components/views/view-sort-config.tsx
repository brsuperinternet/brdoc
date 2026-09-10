import {
  ActionIcon,
  Button,
  Group,
  Popover,
  Select,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEscapeClose } from "@/ee/base/hooks/use-escape-close";
import viewClasses from "@/ee/base/styles/views.module.css";
import { IBaseProperty, ViewSortConfig } from "@/ee/base/types/base.types";

type ViewSortConfigProps = {
  opened: boolean;
  onClose: () => void;
  sorts: ViewSortConfig[];
  properties: IBaseProperty[];
  onChange: (sorts: ViewSortConfig[]) => void;
  children: React.ReactNode;
};

export function ViewSortConfigPopover({
  opened,
  onClose,
  sorts,
  properties,
  onChange,
  children,
}: ViewSortConfigProps) {
  const { t } = useTranslation();
  useEscapeClose(opened, onClose);
  const [draft, setDraft] = useState<ViewSortConfig | null>(null);

  useEffect(() => {
    if (!opened) {
      setDraft(null);
    }
  }, [opened]);

  // Page props sort by raw UUID; hide until title-based sort is supported.
  const sortableProperties = properties.filter((p) => p.type !== "page");

  const propertyOptions = sortableProperties.map((p) => ({
    label: p.name,
    value: p.id,
  }));

  const directionOptions = [
    { label: t("Ascending"), value: "asc" },
    { label: t("Descending"), value: "desc" },
  ];

  const handleStartDraft = useCallback(() => {
    const usedIds = new Set(sorts.map((s) => s.propertyId));
    const available = sortableProperties.find((p) => !usedIds.has(p.id));
    if (!available) {
      return;
    }
    setDraft({ direction: "asc", propertyId: available.id });
  }, [sorts, sortableProperties]);

  const handleSaveDraft = useCallback(() => {
    if (!draft) {
      return;
    }
    onChange([...sorts, draft]);
    setDraft(null);
  }, [draft, sorts, onChange]);

  const handleCancelDraft = useCallback(() => {
    setDraft(null);
  }, []);

  const handleRemove = useCallback(
    (index: number) => {
      onChange(sorts.filter((_, i) => i !== index));
    },
    [sorts, onChange]
  );

  const handlePropertyChange = useCallback(
    (index: number, propertyId: string | null) => {
      if (!propertyId) {
        return;
      }
      onChange(sorts.map((s, i) => (i === index ? { ...s, propertyId } : s)));
    },
    [sorts, onChange]
  );

  const handleDirectionChange = useCallback(
    (index: number, direction: string | null) => {
      if (!direction) {
        return;
      }
      onChange(
        sorts.map((s, i) =>
          i === index ? { ...s, direction: direction as "asc" | "desc" } : s
        )
      );
    },
    [sorts, onChange]
  );

  const canAddMore = sortableProperties.length > sorts.length + (draft ? 1 : 0);

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
      width={340}
      withinPortal
    >
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text c="dimmed" fw={600} size="xs">
            {t("Sort by")}
          </Text>

          {sorts.length === 0 && !draft && (
            <Text c="dimmed" size="xs">
              {t("No sorts applied")}
            </Text>
          )}

          {sorts.map((sort, index) => (
            <Group gap="xs" key={index} wrap="nowrap">
              <Select
                comboboxProps={{ withinPortal: false }}
                data={propertyOptions}
                onChange={(val) => handlePropertyChange(index, val)}
                size="xs"
                style={{ flex: 1 }}
                value={sort.propertyId}
              />
              <Select
                comboboxProps={{ withinPortal: false }}
                data={directionOptions}
                onChange={(val) => handleDirectionChange(index, val)}
                size="xs"
                value={sort.direction}
                w={110}
              />
              <ActionIcon
                color="gray"
                onClick={() => handleRemove(index)}
                size="sm"
                variant="subtle"
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          ))}

          {draft && (
            <Stack gap={6}>
              <Group gap="xs" wrap="nowrap">
                <Select
                  comboboxProps={{ withinPortal: false }}
                  data={propertyOptions}
                  onChange={(val) =>
                    val && setDraft({ ...draft, propertyId: val })
                  }
                  size="xs"
                  style={{ flex: 1 }}
                  value={draft.propertyId}
                />
                <Select
                  comboboxProps={{ withinPortal: false }}
                  data={directionOptions}
                  onChange={(val) =>
                    val &&
                    setDraft({
                      ...draft,
                      direction: val as "asc" | "desc",
                    })
                  }
                  size="xs"
                  value={draft.direction}
                  w={110}
                />
              </Group>
              <Group gap="xs" justify="flex-end">
                <Button onClick={handleCancelDraft} size="xs" variant="default">
                  {t("Cancel")}
                </Button>
                <Button onClick={handleSaveDraft} size="xs">
                  {t("Save")}
                </Button>
              </Group>
            </Stack>
          )}

          {!draft && canAddMore && (
            <UnstyledButton
              className={viewClasses.addActionButton}
              onClick={handleStartDraft}
            >
              <IconPlus size={14} />
              {t("Add sort")}
            </UnstyledButton>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
