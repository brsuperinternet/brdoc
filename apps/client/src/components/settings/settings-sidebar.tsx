import { ActionIcon, Group, ScrollArea, Text, Tooltip } from "@mantine/core";
import {
  IconArrowLeft,
  IconBrush,
  IconCoin,
  IconHistory,
  IconKey,
  IconLock,
  IconSettings,
  IconShieldCheck,
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
  prefetchApiKeyManagement,
  prefetchApiKeys,
  prefetchAuditLogs,
  prefetchBilling,
  prefetchGroups,
  prefetchLicense,
  prefetchScimTokens,
  prefetchShares,
  prefetchSpaces,
  prefetchSsoProviders,
  prefetchVerifiedPages,
  prefetchWorkspaceMembers,
} from "@/components/settings/settings-queries.tsx";
import { entitlementAtom } from "@/ee/entitlement/entitlement-atom";
import { Feature } from "@/ee/features";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import { useSettingsNavigation } from "@/hooks/use-settings-navigation";
import useUserRole from "@/hooks/use-user-role.tsx";
import { isCloud } from "@/lib/config.ts";
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
      {
        feature: Feature.API_KEYS,
        icon: IconKey,
        label: "API keys",
        path: "/settings/account/api-keys",
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
      {
        feature: Feature.SECURITY_SETTINGS,
        icon: IconLock,
        label: "Security & SSO",
        path: "/settings/security",
        role: "admin",
      },
      { icon: IconUsersGroup, label: "Groups", path: "/settings/groups" },
      { icon: IconSpaces, label: "Spaces", path: "/settings/spaces" },
      { icon: IconWorld, label: "Public sharing", path: "/settings/sharing" },
      {
        feature: Feature.PAGE_VERIFICATION,
        icon: IconShieldCheck,
        label: "Verified pages",
        path: "/settings/verifications",
      },
      {
        feature: Feature.API_KEYS,
        icon: IconKey,
        label: "API management",
        path: "/settings/api-keys",
        role: "admin",
      },
      {
        icon: IconSparkles,
        label: "AI settings",
        path: "/settings/ai",
        role: "admin",
      },
      {
        env: "selfhosted",
        feature: Feature.AUDIT_LOGS,
        icon: IconHistory,
        label: "Audit logs & SIEM",
        path: "/settings/audit",
        role: "owner",
      },
    ],
  },
  {
    heading: "System",
    items: [
      {
        icon: IconKey,
        label: "License & Edition",
        path: "/settings/license",
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
  const [entitlements] = useAtom(entitlementAtom);
  const upgradeLabel = useUpgradeLabel();
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  useEffect(() => {
    setActive(location.pathname);
  }, [location.pathname]);

  const hasFeature = (f: string) =>
    entitlements?.features?.includes(f) ?? false;

  const canShowItem = (item: DataItem) => {
    if (item.env === "cloud" && !isCloud()) {
      return false;
    }
    if (item.env === "selfhosted" && isCloud()) {
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

  const isItemDisabled = (item: DataItem) => {
    if (!item.feature) {
      return false;
    }
    return !hasFeature(item.feature);
  };

  const menuItems = groupedData.map((group) => {
    if (group.heading === "System" && (!isAdmin || isCloud())) {
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
            case "Billing":
              prefetchHandler = prefetchBilling;
              break;
            case "License & Edition":
              if (entitlements?.tier !== "free") {
                prefetchHandler = prefetchLicense;
              }
              break;
            case "Security & SSO":
              prefetchHandler = () => {
                prefetchSsoProviders();
                prefetchScimTokens();
              };
              break;
            case "Public sharing":
              prefetchHandler = prefetchShares;
              break;
            case "API keys":
              prefetchHandler = prefetchApiKeys;
              break;
            case "API management":
              prefetchHandler = prefetchApiKeyManagement;
              break;
            case "Audit logs & SIEM":
              prefetchHandler = prefetchAuditLogs;
              break;
            case "Verified pages":
              prefetchHandler = prefetchVerifiedPages;
              break;
            default:
              break;
          }

          const isDisabled = isItemDisabled(item);

          if (isDisabled) {
            return (
              <Tooltip
                key={item.label}
                label={upgradeLabel}
                position="right"
                withArrow
              >
                <span
                  aria-disabled="true"
                  className={classes.link}
                  data-disabled
                  role="link"
                  style={{
                    cursor: "not-allowed",
                    opacity: 0.5,
                  }}
                  tabIndex={0}
                >
                  <item.icon className={classes.linkIcon} stroke={2} />
                  <span>{t(item.label)}</span>
                </span>
              </Tooltip>
            );
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

      {!isCloud() && <AppVersion />}

      {isCloud() && (
        <div className={classes.text}>
          <Text
            c="dimmed"
            component="a"
            href="mailto:help@docmost.com"
            size="sm"
          >
            help@docmost.com
          </Text>
        </div>
      )}
    </div>
  );
}
