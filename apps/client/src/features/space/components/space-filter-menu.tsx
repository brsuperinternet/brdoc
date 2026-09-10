import {
  Avatar,
  Divider,
  Group,
  getDefaultZIndex,
  Menu,
  ScrollArea,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconCheck, IconSearch } from "@tabler/icons-react";
import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RadioMenuItem } from "@/components/ui/radio-menu-item";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";

type SpaceFilterMenuProps = {
  value: string | null;
  onChange: (spaceId: string | null) => void;
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
};

export function SpaceFilterMenu({
  value,
  onChange,
  children,
  width = 280,
  position = "bottom-end",
  zIndex,
}: SpaceFilterMenuProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);

  const { data: spacesData } = useGetSpacesQuery({
    limit: 100,
    query: debouncedQuery,
  });
  const spaces = spacesData?.items ?? [];

  const orderedSpaces = useMemo(() => {
    if (!value) {
      return spaces;
    }
    return [...spaces].sort((a, b) => {
      if (a.id === value) {
        return -1;
      }
      if (b.id === value) {
        return 1;
      }
      return 0;
    });
  }, [spaces, value]);

  return (
    <Menu position={position} shadow="md" width={width} zIndex={zIndex}>
      <Menu.Target>{children}</Menu.Target>
      <Menu.Dropdown>
        <TextInput
          autoFocus
          data-autofocus
          leftSection={<IconSearch size={16} />}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("Find a space")}
          radius="sm"
          size="sm"
          styles={{ input: { marginBottom: 8 } }}
          value={searchQuery}
          variant="filled"
        />

        <ScrollArea.Autosize mah={280}>
          <Menu.Item
            aria-checked={!value}
            component={RadioMenuItem}
            onClick={() => onChange(null)}
          >
            <Group flex="1" gap="xs">
              <Avatar
                color="initials"
                name={t("All spaces")}
                size={20}
                variant="filled"
              />
              <div style={{ flex: 1 }}>
                <Text fw={500} size="sm">
                  {t("All spaces")}
                </Text>
                <Text c="dimmed" size="xs">
                  {t("Search in all your spaces")}
                </Text>
              </div>
              {!value && <IconCheck aria-hidden size={20} />}
            </Group>
          </Menu.Item>

          <Divider my="xs" />

          {orderedSpaces.map((space) => (
            <Menu.Item
              aria-checked={value === space.id}
              component={RadioMenuItem}
              key={space.id}
              onClick={() => onChange(space.id)}
            >
              <Group flex="1" gap="xs">
                <Avatar
                  color="initials"
                  name={space.name}
                  size={20}
                  variant="filled"
                />
                <Text fw={500} size="sm" style={{ flex: 1 }} truncate>
                  {space.name}
                </Text>
                {value === space.id && <IconCheck aria-hidden size={20} />}
              </Group>
            </Menu.Item>
          ))}
        </ScrollArea.Autosize>
      </Menu.Dropdown>
    </Menu>
  );
}

export const SPACE_FILTER_MENU_MAX_Z = getDefaultZIndex("max");
