import { ActionIcon, Group, ScrollArea, Text } from "@mantine/core";
import {
  IconArrowLeft,
  IconBrush,
  IconCoin,
  IconSettings,
  IconSpaces,
  IconSparkles,
  IconUser,
  IconUsers,
  IconUsersGroup,
  IconWorld,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import AppVersion from "@/components/settings/app-version.tsx";
import {
  prefetchGroups,
  prefetchShares,
  prefetchSpaces,
  prefetchWorkspaceMembers,
} from "@/components/settings/settings-queries.tsx";

import { useSettingsNavigation } from "@/hooks/use-settings-navigation";
import useUserRole from "@/hooks/use-user-role.tsx";
import classes from "./settings.module.css";

type DataItem = {
  label: string;
  icon: React.ElementType;
  path: string;
  feature?: string;
  role?: "admin" | "owner";
  env?: "cloud" | "selfhosted";
};

type DataGroup = {
  heading: string;
  items: DataItem[];
};

const groupedData: DataGroup[] = [
  {
    heading: "Account",
    items: [
      { icon: IconUser, label: "Profile", path: "/settings/account/profile" },
      {
        icon: IconBrush,
        label: "Preferences",
        path: "/settings/account/preferences",
      },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { icon: IconSettings, label: "General", path: "/settings/workspace" },
      { icon: IconUsers, label: "Members", path: "/settings/members" },
      {
        env: "cloud",
        icon: IconCoin,
        label: "Billing",
        path: "/settings/billing",
        role: "admin",
      },
      { icon: IconUsersGroup, label: "Groups", path: "/settings/groups" },
      { icon: IconSpaces, label: "Spaces", path: "/settings/spaces" },
      { icon: IconWorld, label: "Public sharing", path: "/settings/sharing" },
      {
        icon: IconSparkles,
        label: "AI settings",
        path: "/settings/ai",
        role: "admin",
      },
    ],
  },
];

export default function SettingsSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [active, setActive] = useState(location.pathname);
  const { goBack } = useSettingsNavigation();
  const { isAdmin, isOwner } = useUserRole();

  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  useEffect(() => {
    setActive(location.pathname);
  }, [location.pathname]);

  const canShowItem = (item: DataItem) => {
    if (item.env === "cloud") {
      return false;
    }

    if (item.role === "admin" && !isAdmin) {
      return false;
    }
    if (item.role === "owner" && !isOwner) {
      return false;
    }
    return true;
  };

  const menuItems = groupedData.map((group) => {
    if (group.heading === "System" && !isAdmin) {
      return null;
    }

    return (
      <div key={group.heading}>
        <Text c="dimmed" className={classes.linkHeader}>
          {t(group.heading)}
        </Text>
        {group.items.map((item) => {
          if (!canShowItem(item)) {
            return null;
          }

          let prefetchHandler: any;
          switch (item.label) {
            case "Members":
              prefetchHandler = prefetchWorkspaceMembers;
              break;
            case "Spaces":
              prefetchHandler = prefetchSpaces;
              break;
            case "Groups":
              prefetchHandler = prefetchGroups;
              break;
            case "Public sharing":
              prefetchHandler = prefetchShares;
              break;
            default:
              break;
          }

          return (
            <Link
              className={classes.link}
              data-active={active.startsWith(item.path) || undefined}
              key={item.label}
              onClick={() => {
                if (mobileSidebarOpened) {
                  toggleMobileSidebar();
                }
              }}
              onMouseEnter={prefetchHandler}
              to={item.path}
            >
              <item.icon className={classes.linkIcon} stroke={2} />
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    );
  });

  return (
    <div className={classes.navbar}>
      <Group className={classes.title} justify="flex-start">
        <ActionIcon
          aria-label={t("Back")}
          c="gray"
          onClick={() => {
            goBack();
            if (mobileSidebarOpened) {
              toggleMobileSidebar();
            }
          }}
          variant="transparent"
        >
          <IconArrowLeft stroke={2} />
        </ActionIcon>
        <Text fw={500}>{t("Settings")}</Text>
      </Group>

      <ScrollArea w="100%">{menuItems}</ScrollArea>

      <AppVersion />
    </div>
  );
}
