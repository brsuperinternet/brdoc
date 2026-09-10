import {
  ActionIcon,
  Group,
  Indicator,
  Menu,
  Popover,
  ScrollArea,
  Tabs,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconBell,
  IconCheck,
  IconChecks,
  IconDots,
  IconFilter,
} from "@tabler/icons-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useMarkAllReadMutation,
  useUnreadCountQuery,
} from "../queries/notification-query";
import {
  NotificationFilter,
  NotificationTab,
} from "../types/notification.types";
import { NotificationList } from "./notification-list";

export function NotificationPopover() {
  const { t } = useTranslation();
  const titleId = useId();
  const [opened, setOpened] = useState(false);
  const [tab, setTab] = useState<NotificationTab>("direct");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [filterMenuOpened, setFilterMenuOpened] = useState(false);
  const [moreMenuOpened, setMoreMenuOpened] = useState(false);

  const { data: unreadData } = useUnreadCountQuery();
  const markAllRead = useMarkAllReadMutation();

  const unreadCount = unreadData?.count ?? 0;
  const isSubMenuOpen = filterMenuOpened || moreMenuOpened;

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  return (
    <Popover
      closeOnEscape={!isSubMenuOpen}
      onChange={setOpened}
      opened={opened}
      position="bottom-end"
      returnFocus
      shadow="lg"
      trapFocus
      withArrow
    >
      <Popover.Target>
        <Tooltip label={t("Notifications")} withArrow>
          <ActionIcon
            aria-expanded={opened}
            aria-haspopup="dialog"
            aria-label={t("Notifications")}
            color="dark"
            onClick={() => setOpened((o) => !o)}
            size="sm"
            variant="subtle"
          >
            <Indicator
              color="red"
              disabled={unreadCount === 0}
              offset={5}
              withBorder
            >
              <IconBell size={20} />
            </Indicator>
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown
        aria-labelledby={titleId}
        p={0}
        style={{ width: "min(420px, calc(100vw - 24px))" }}
      >
        <Group justify="space-between" px="md" py="sm">
          <Title fw={600} fz="sm" id={titleId} order={2}>
            {t("Notifications")}
          </Title>
          <Group gap={4}>
            <Menu
              onChange={setFilterMenuOpened}
              opened={filterMenuOpened}
              position="bottom-end"
              withArrow
              withinPortal={false}
            >
              <Menu.Target>
                <Tooltip label={t("Filter")} withArrow>
                  <ActionIcon
                    aria-label={t("Filter")}
                    color="dark"
                    size="sm"
                    variant="subtle"
                  >
                    <IconFilter size={16} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{t("Filter")}</Menu.Label>
                <Menu.Item
                  onClick={() => setFilter("all")}
                  rightSection={
                    filter === "all" ? <IconCheck size={14} /> : null
                  }
                >
                  {t("All notifications")}
                </Menu.Item>
                <Menu.Item
                  onClick={() => setFilter("unread")}
                  rightSection={
                    filter === "unread" ? <IconCheck size={14} /> : null
                  }
                >
                  {t("Unread only")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Menu
              onChange={setMoreMenuOpened}
              opened={moreMenuOpened}
              position="bottom-end"
              withArrow
              withinPortal={false}
            >
              <Menu.Target>
                <Tooltip label={t("More options")} withArrow>
                  <ActionIcon
                    aria-label={t("More options")}
                    color="dark"
                    size="sm"
                    variant="subtle"
                  >
                    <IconDots size={16} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  disabled={unreadCount === 0}
                  leftSection={<IconChecks size={16} />}
                  onClick={handleMarkAllRead}
                >
                  {t("Mark all as read")}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <Tabs
          color="dark"
          onChange={(value) => setTab(value as NotificationTab)}
          value={tab}
          variant="default"
        >
          <Tabs.List px="md">
            <Tabs.Tab value="direct">{t("Direct")}</Tabs.Tab>
            <Tabs.Tab value="updates">{t("Updates")}</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <ScrollArea.Autosize
          mah={500}
          offsetScrollbars
          scrollbarSize={6}
          style={{ overscrollBehavior: "contain" }}
          type="auto"
        >
          <NotificationList
            filter={filter}
            onNavigate={() => setOpened(false)}
            tab={tab}
          />
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
