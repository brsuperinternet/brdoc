import {
  Group,
  Menu,
  ScrollArea,
  Text,
  TextInput,
  useComputedColorScheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconCheck, IconSearch } from "@tabler/icons-react";
import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckboxMenuItem } from "@/components/ui/checkbox-menu-item";
import { useWorkspaceLabelsQuery } from "@/features/label/queries/label-query.ts";
import { getLabelColor } from "@/features/label/utils/label-colors.ts";

type LabelFilterMenuProps = {
  value: string[];
  onChange: (labelIds: string[]) => void;
  children: ReactNode;
  width?: number;
  position?:
    | "bottom-start"
    | "bottom-end"
    | "bottom"
    | "top-start"
    | "top-end"
    | "top";
  zIndex?: number;
  opened?: boolean;
  onOpenChange?: (opened: boolean) => void;
};

export function LabelFilterMenu({
  value,
  onChange,
  children,
  width = 280,
  position = "bottom-end",
  zIndex,
  opened,
  onOpenChange,
}: LabelFilterMenuProps) {
  const { t } = useTranslation();
  const scheme = useComputedColorScheme("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);

  const { data, isLoading } = useWorkspaceLabelsQuery(debouncedQuery, true);
  const labels = data?.items ?? [];

  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggleLabel = (labelId: string) => {
    if (selectedSet.has(labelId)) {
      onChange(value.filter((id) => id !== labelId));
    } else {
      onChange([...value, labelId]);
    }
  };

  return (
    <Menu
      closeOnItemClick={false}
      onChange={onOpenChange}
      opened={opened}
      position={position}
      shadow="md"
      width={width}
      zIndex={zIndex}
    >
      <Menu.Target>{children}</Menu.Target>
      <Menu.Dropdown>
        <TextInput
          autoFocus
          data-autofocus
          leftSection={<IconSearch size={16} />}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("Find a label")}
          radius="sm"
          size="sm"
          styles={{ input: { marginBottom: 8 } }}
          value={searchQuery}
          variant="filled"
        />

        <ScrollArea.Autosize mah={280}>
          {labels.length === 0 && (
            <Text c="dimmed" px="xs" py="sm" size="xs">
              {isLoading ? t("Loading...") : t("No labels found")}
            </Text>
          )}

          {labels.map((label) => {
            const isChecked = selectedSet.has(label.id);
            const color = getLabelColor(label.name, scheme);
            return (
              <Menu.Item
                aria-checked={isChecked}
                component={CheckboxMenuItem}
                key={label.id}
                onClick={() => toggleLabel(label.id)}
                type="button"
              >
                <Group flex="1" gap="xs">
                  <span
                    style={{
                      background: color.dot,
                      borderRadius: "50%",
                      flexShrink: 0,
                      height: 8,
                      width: 8,
                    }}
                  />
                  <Text fw={500} size="sm" style={{ flex: 1 }} truncate>
                    {label.name}
                  </Text>
                  {isChecked && <IconCheck aria-hidden size={20} />}
                </Group>
              </Menu.Item>
            );
          })}
        </ScrollArea.Autosize>
      </Menu.Dropdown>
    </Menu>
  );
}
