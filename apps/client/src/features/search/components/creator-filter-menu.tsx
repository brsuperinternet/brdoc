import {
  Divider,
  Group,
  Menu,
  ScrollArea,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconCheck, IconSearch } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { RadioMenuItem } from "@/components/ui/radio-menu-item";
import { useSearchSuggestionsQuery } from "@/features/search/queries/search-query";
import { userAtom } from "@/features/user/atoms/current-user-atom.ts";
import { IUser } from "@/features/user/types/user.types.ts";

type CreatorFilterMenuProps = {
  value: string | null;
  onChange: (user: IUser | null) => void;
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

export function CreatorFilterMenu({
  value,
  onChange,
  children,
  width = 280,
  position = "bottom-end",
  zIndex,
  opened,
  onOpenChange,
}: CreatorFilterMenuProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);

  const { data: suggestion, isLoading } = useSearchSuggestionsQuery({
    includeGroups: false,
    includePages: false,
    includeUsers: true,
    preload: true,
    query: debouncedQuery,
  });

  const users: IUser[] = (suggestion?.users as IUser[]) ?? [];
  const currentUser = useAtomValue(userAtom);

  // pin the signed-in user on top so they never have to search themselves
  const displayUsers = useMemo(() => {
    if (!currentUser) {
      return users;
    }
    const others = users.filter((user) => user.id !== currentUser.id);
    const q = debouncedQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      currentUser.name?.toLowerCase().includes(q) ||
      currentUser.email?.toLowerCase().includes(q);
    return matchesQuery ? [currentUser as IUser, ...others] : users;
  }, [users, currentUser, debouncedQuery]);

  return (
    <Menu
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
          placeholder={t("Find a user")}
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
              <div style={{ flex: 1 }}>
                <Text fw={500} size="sm">
                  {t("Anyone")}
                </Text>
              </div>
              {!value && <IconCheck aria-hidden size={20} />}
            </Group>
          </Menu.Item>

          <Divider my="xs" />

          {displayUsers.length === 0 && (
            <Text c="dimmed" px="xs" py="sm" size="xs">
              {isLoading ? t("Loading...") : t("No users found")}
            </Text>
          )}

          {displayUsers.map((user) => (
            <Menu.Item
              aria-checked={value === user.id}
              component={RadioMenuItem}
              key={user.id}
              onClick={() => onChange(user)}
            >
              <Group flex="1" gap="xs">
                <CustomAvatar
                  avatarUrl={user.avatarUrl}
                  name={user.name}
                  size={20}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={500} size="sm" truncate>
                    {user.name}
                    {user.id === currentUser?.id && (
                      <Text c="dimmed" fw={400} size="sm" span>
                        {" "}
                        ({t("you")})
                      </Text>
                    )}
                  </Text>
                  {user.email && (
                    <Text c="dimmed" size="xs" truncate>
                      {user.email}
                    </Text>
                  )}
                </div>
                {value === user.id && <IconCheck aria-hidden size={20} />}
              </Group>
            </Menu.Item>
          ))}
        </ScrollArea.Autosize>
      </Menu.Dropdown>
    </Menu>
  );
}
