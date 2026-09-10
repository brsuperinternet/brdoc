import {
  ActionIcon,
  Avatar,
  Checkbox,
  Group,
  Menu,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconDots } from "@tabler/icons-react";
import clsx from "clsx";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { IPageHistory } from "@/features/page-history/types/page.types";
import { formattedDate } from "@/lib/time";
import classes from "./css/history.module.css";

const MAX_VISIBLE_AVATARS = 5;

interface HistoryItemProps {
  canCompare: boolean;
  compareMode: boolean;
  historyItem: IPageHistory;
  index: number;
  isActive: boolean;
  isCheckboxDisabled: boolean;
  isChecked: boolean;
  onHover?: (id: string, index: number) => void;
  onHoverEnd?: () => void;
  onRestore?: (id: string, index: number) => void;
  onSelect: (id: string, index: number) => void;
  onStartCompare: (id: string) => void;
  onToggleCompare: (id: string) => void;
}

const HistoryItem = memo(function HistoryItem({
  historyItem,
  index,
  onSelect,
  onHover,
  onHoverEnd,
  isActive,
  compareMode,
  isChecked,
  isCheckboxDisabled,
  canCompare,
  onToggleCompare,
  onStartCompare,
  onRestore,
}: HistoryItemProps) {
  const { t } = useTranslation();
  const date = formattedDate(new Date(historyItem.createdAt));

  const handleClick = useCallback(() => {
    if (compareMode) {
      onToggleCompare(historyItem.id);
    } else {
      onSelect(historyItem.id, index);
    }
  }, [compareMode, onToggleCompare, onSelect, historyItem.id, index]);

  const handleMouseEnter = useCallback(() => {
    onHover?.(historyItem.id, index);
  }, [onHover, historyItem.id, index]);

  const contributors = historyItem.contributors;
  const hasContributors = contributors && contributors.length > 0;

  return (
    <div
      className={clsx(classes.history, { [classes.active]: isActive })}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onHoverEnd}
    >
      {compareMode && (
        <Checkbox
          aria-label={t("Select version from {{date}}", { date })}
          checked={isChecked}
          className={classes.compareCheckbox}
          disabled={isCheckboxDisabled}
          onChange={() => onToggleCompare(historyItem.id)}
          size="xs"
        />
      )}

      <UnstyledButton
        className={classes.historyButton}
        onClick={handleClick}
        p="xs"
      >
        <Text size="sm">{date}</Text>

        <Group gap={6} mt={4} wrap="nowrap">
          {hasContributors ? (
            <>
              <Tooltip.Group closeDelay={100} openDelay={300}>
                <Avatar.Group spacing={8}>
                  {contributors
                    .slice(0, MAX_VISIBLE_AVATARS)
                    .map((contributor) => (
                      <Tooltip
                        key={contributor.id}
                        label={contributor.name}
                        withArrow
                      >
                        <CustomAvatar
                          avatarUrl={contributor.avatarUrl}
                          name={contributor.name}
                          size="sm"
                        />
                      </Tooltip>
                    ))}
                  {contributors.length > MAX_VISIBLE_AVATARS && (
                    <Tooltip
                      label={contributors
                        .slice(MAX_VISIBLE_AVATARS)
                        .map((c) => <div key={c.id}>{c.name}</div>)}
                      withArrow
                    >
                      <Avatar color="gray" size="sm">
                        +{contributors.length - MAX_VISIBLE_AVATARS}
                      </Avatar>
                    </Tooltip>
                  )}
                </Avatar.Group>
              </Tooltip.Group>
              {contributors.length === 1 && (
                <Text c="dimmed" lineClamp={1} size="sm">
                  {contributors[0].name}
                </Text>
              )}
            </>
          ) : (
            <>
              <CustomAvatar
                avatarUrl={historyItem.lastUpdatedBy?.avatarUrl}
                name={historyItem.lastUpdatedBy?.name}
                size="sm"
              />
              <Text c="dimmed" lineClamp={1} size="sm">
                {historyItem.lastUpdatedBy?.name}
              </Text>
            </>
          )}
        </Group>
      </UnstyledButton>

      {!compareMode && (
        <Menu position="bottom-end" shadow="md" width={180}>
          <Menu.Target>
            <ActionIcon
              aria-label={t("Version actions for {{date}}", { date })}
              className={classes.itemMenu}
              color="gray"
              onClick={(e) => e.stopPropagation()}
              variant="subtle"
            >
              <IconDots size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              disabled={!canCompare}
              onClick={() => onStartCompare(historyItem.id)}
            >
              {t("Compare")}
            </Menu.Item>
            {onRestore && (
              <Menu.Item onClick={() => onRestore(historyItem.id, index)}>
                {t("Restore")}
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      )}
    </div>
  );
});

export default HistoryItem;
