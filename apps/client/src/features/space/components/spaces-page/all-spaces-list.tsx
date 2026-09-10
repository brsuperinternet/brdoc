import {
  ActionIcon,
  Anchor,
  Box,
  Group,
  Menu,
  Space,
  Table,
  Text,
  Tooltip,
  VisuallyHidden,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDots,
  IconEye,
  IconEyeOff,
  IconSettings,
} from "@tabler/icons-react";
import clsx from "clsx";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import NoTableResults from "@/components/common/no-table-results";
import Paginate from "@/components/common/paginate";
import { SearchInput } from "@/components/common/search-input";
import { AutoTooltipText } from "@/components/ui/auto-tooltip-text.tsx";
import rowClasses from "@/components/ui/clickable-table-row.module.css";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import StarButton from "@/features/favorite/components/star-button";
import SpaceSettingsModal from "@/features/space/components/settings-modal";
import { prefetchSpace } from "@/features/space/queries/space-query";
import {
  useUnwatchSpaceMutation,
  useWatchedSpaceIds,
  useWatchSpaceMutation,
} from "@/features/space/queries/space-watcher-query";
import { formatMemberCount } from "@/lib";
import { getSpaceUrl } from "@/lib/config";
import classes from "./all-spaces-list.module.css";

function WatchButton({
  spaceId,
  watchedIds,
  size = 16,
}: {
  spaceId: string;
  watchedIds: Set<string>;
  size?: number;
}) {
  const { t } = useTranslation();
  const watchMutation = useWatchSpaceMutation();
  const unwatchMutation = useUnwatchSpaceMutation();
  const isWatching = watchedIds.has(spaceId);
  const isPending = watchMutation.isPending || unwatchMutation.isPending;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isWatching) {
      unwatchMutation.mutate(spaceId);
    } else {
      watchMutation.mutate(spaceId);
    }
  };

  const label = isWatching ? t("Stop watching space") : t("Watch space");

  return (
    <Tooltip label={label} openDelay={250} withArrow>
      <ActionIcon
        aria-label={label}
        aria-pressed={isWatching}
        color={isWatching ? "blue" : "gray"}
        loading={isPending}
        onClick={handleToggle}
        variant="subtle"
      >
        {isWatching ? (
          <IconEyeOff size={size} stroke={2} />
        ) : (
          <IconEye size={size} stroke={2} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}

interface AllSpacesListProps {
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSearch: (query: string) => void;
  spaces: any[];
}

export default function AllSpacesList({
  spaces,
  onSearch,
  hasPrevPage,
  hasNextPage,
  onNext,
  onPrev,
}: AllSpacesListProps) {
  const { t } = useTranslation();
  const watchedIds = useWatchedSpaceIds();
  const [settingsOpened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  const handleOpenSettings = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    openSettings();
  };

  return (
    <Box>
      <SearchInput onSearch={onSearch} />

      <Space h="md" />

      <Table.ScrollContainer minWidth={500}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Caption>
            <VisuallyHidden>
              {t("List of spaces in this workspace")}
            </VisuallyHidden>
          </Table.Caption>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Space")}</Table.Th>
              <Table.Th>{t("Members")}</Table.Th>
              <Table.Th w={130}>
                <VisuallyHidden>{t("Action")}</VisuallyHidden>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {spaces.length > 0 ? (
              spaces.map((space) => (
                <Table.Tr className={rowClasses.row} key={space.id}>
                  <Table.Td>
                    <Anchor
                      className={clsx(classes.spaceLink, rowClasses.link)}
                      component={Link}
                      size="sm"
                      style={{
                        color: "var(--mantine-color-text)",
                        cursor: "pointer",
                      }}
                      to={getSpaceUrl(space.slug)}
                      underline="never"
                    >
                      <Group
                        gap="sm"
                        onMouseEnter={() => prefetchSpace(space.slug, space.id)}
                        wrap="nowrap"
                      >
                        <CustomAvatar
                          avatarUrl={space.logo}
                          color="initials"
                          name={space.name}
                          size="md"
                          type={AvatarIconType.SPACE_ICON}
                          variant="filled"
                        />
                        <div
                          style={{
                            maxWidth: 350,
                            minWidth: 0,
                            overflow: "hidden",
                          }}
                        >
                          <AutoTooltipText fw={500} fz="sm" lineClamp={1}>
                            {space.name}
                          </AutoTooltipText>
                          {space.description && (
                            <Text c="dimmed" fz="xs" lineClamp={2}>
                              {space.description}
                            </Text>
                          )}
                        </div>
                      </Group>
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ whiteSpace: "nowrap" }}>
                      {formatMemberCount(space.memberCount, t)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="flex-end" wrap="nowrap">
                      <StarButton
                        name={space.name}
                        size={16}
                        spaceId={space.id}
                        type="space"
                      />
                      <WatchButton
                        size={16}
                        spaceId={space.id}
                        watchedIds={watchedIds}
                      />
                      <Menu position="bottom-end">
                        <Menu.Target>
                          <ActionIcon
                            aria-label={t("Space menu")}
                            color="gray"
                            variant="subtle"
                          >
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconSettings size={16} />}
                            onClick={() => handleOpenSettings(space.id)}
                          >
                            {t("Space settings")}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <NoTableResults colSpan={3} />
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {spaces.length > 0 && (
        <Paginate
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onNext={onNext}
          onPrev={onPrev}
        />
      )}

      {selectedSpaceId && (
        <SpaceSettingsModal
          onClose={closeSettings}
          opened={settingsOpened}
          spaceId={selectedSpaceId}
        />
      )}
    </Box>
  );
}
