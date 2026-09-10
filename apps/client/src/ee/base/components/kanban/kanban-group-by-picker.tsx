import {
  Group,
  Popover,
  Select,
  Stack,
  Switch,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { choiceColor } from "@/ee/base/components/cells/choice-color";
import { useKanbanColumns } from "@/ee/base/hooks/use-kanban-columns";
import { useUpdateViewMutation } from "@/ee/base/queries/base-view-query";
import cellClasses from "@/ee/base/styles/cells.module.css";
import { IBase, IBaseView } from "@/ee/base/types/base.types";

type KanbanGroupByPickerProps = {
  base: IBase;
  view: IBaseView;
  pageId: string;
  children: React.ReactNode;
};

export function KanbanGroupByPicker({
  base,
  view,
  pageId,
  children,
}: KanbanGroupByPickerProps) {
  const { t } = useTranslation();
  const updateView = useUpdateViewMutation();
  const { allGroups, hasValidGroupBy } = useKanbanColumns(base, view);

  const data = base.properties
    .filter((p) => p.type === "select" || p.type === "status")
    .map((p) => ({ label: p.name, value: p.id }));

  const handleChange = (value: string | null) => {
    updateView.mutate({
      config: { groupByPropertyId: value ?? null },
      pageId,
      viewId: view.id,
    });
  };

  const toggleGroup = (key: string, currentlyHidden: boolean) => {
    const current = view.config?.hiddenChoiceIds ?? [];
    const next = currentlyHidden
      ? current.filter((k) => k !== key)
      : [...current, key];
    updateView.mutate({
      config: { hiddenChoiceIds: next },
      pageId,
      viewId: view.id,
    });
  };

  return (
    <Popover
      closeOnClickOutside
      closeOnEscape
      position="bottom-end"
      shadow="md"
      trapFocus
      width={300}
      withinPortal
    >
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown p="xs">
        <Stack gap={8}>
          <Text c="dimmed" fw={600} size="xs">
            {t("Group by")}
          </Text>
          <Select
            clearable
            data={data}
            onChange={handleChange}
            placeholder={t("Select a property")}
            size="xs"
            value={view.config?.groupByPropertyId ?? null}
          />
          {hasValidGroupBy && allGroups.length > 0 && (
            <Stack gap={4}>
              <Text c="dimmed" fw={600} size="xs">
                {t("Groups")}
              </Text>
              <Stack gap={0}>
                {allGroups.map((g) => {
                  const dotColor = g.color
                    ? (choiceColor(g.color).color as string)
                    : "light-dark(var(--mantine-color-gray-4), var(--mantine-color-dark-3))";
                  return (
                    <UnstyledButton
                      className={cellClasses.menuItem}
                      key={g.key}
                      onClick={() => toggleGroup(g.key, g.hidden)}
                    >
                      <Group gap={8} style={{ flex: 1 }} wrap="nowrap">
                        <span
                          style={{
                            background: dotColor,
                            borderRadius: "50%",
                            flexShrink: 0,
                            height: 8,
                            width: 8,
                          }}
                        />
                        <Text
                          size="sm"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {g.isNoValue ? t("No value") : g.name}
                        </Text>
                      </Group>
                      <Switch
                        checked={!g.hidden}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        size="xs"
                        styles={{ track: { cursor: "pointer" } }}
                      />
                    </UnstyledButton>
                  );
                })}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
