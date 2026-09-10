import { Center, Divider, Loader, Stack, Text } from "@mantine/core";
import { IconBellOff } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import classes from "../notification.module.css";
import { groupNotificationsByTime } from "../notification.utils";
import { useNotificationsQuery } from "../queries/notification-query";
import {
  INotification,
  NotificationFilter,
  NotificationTab,
} from "../types/notification.types";
import { NotificationItem } from "./notification-item";

type NotificationListProps = {
  tab: NotificationTab;
  filter: NotificationFilter;
  onNavigate: () => void;
};

export function NotificationList({
  tab,
  filter,
  onNavigate,
}: NotificationListProps) {
  const { t } = useTranslation();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useNotificationsQuery(tab as string);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader size="sm" />
      </Center>
    );
  }

  const allNotifications = data?.pages.flatMap((page) => page.items) ?? [];

  const filtered =
    filter === "unread"
      ? allNotifications.filter((n) => !n.readAt)
      : allNotifications;

  if (filtered.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="xs">
          <IconBellOff
            color="var(--mantine-color-dimmed)"
            size={32}
            stroke={1.5}
          />
          <Text c="dimmed" size="sm">
            {filter === "unread"
              ? t("No unread notifications")
              : t("No notifications")}
          </Text>
        </Stack>
      </Center>
    );
  }

  const timeGroupLabels = {
    older: t("Older"),
    this_week: t("This week"),
    today: t("Today"),
    yesterday: t("Yesterday"),
  };

  const groups = groupNotificationsByTime(filtered, timeGroupLabels);

  return (
    <Stack gap={0}>
      {groups.map((group, groupIndex) => (
        <div key={group.key}>
          {groupIndex > 0 && <Divider className={classes.divider} />}
          <Text c="dimmed" fw={600} pb={4} pt="sm" px="md" size="xs">
            {group.label}
          </Text>
          {group.notifications.map((notification: INotification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {isFetchingNextPage && (
        <Center py="xs">
          <Loader size="xs" />
        </Center>
      )}
    </Stack>
  );
}
