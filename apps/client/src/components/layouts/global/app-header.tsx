import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconSparkles } from "@tabler/icons-react";
import { useAtom } from "jotai";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
  desktopSidebarAtom,
  mobileSidebarAtom,
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import TopMenu from "@/components/layouts/global/top-menu.tsx";
import SidebarToggle from "@/components/ui/sidebar-toggle-button.tsx";
import useTrial from "@/ee/hooks/use-trial.tsx";
import { NotificationPopover } from "@/features/notification/components/notification-popover.tsx";
import {
  SearchControl,
  SearchMobileControl,
} from "@/features/search/components/search-control.tsx";
import { searchSpotlight } from "@/features/search/constants.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import useToggleAside from "@/hooks/use-toggle-aside.tsx";
import APP_ROUTE from "@/lib/app-route.ts";
import { isCloud } from "@/lib/config.ts";
import classes from "./app-header.module.css";

const links = [{ label: "Home", link: APP_ROUTE.HOME }];

export function AppHeader() {
  const { t } = useTranslation();
  const [mobileOpened] = useAtom(mobileSidebarAtom);
  const toggleMobile = useToggleSidebar(mobileSidebarAtom);

  const [desktopOpened] = useAtom(desktopSidebarAtom);
  const toggleDesktop = useToggleSidebar(desktopSidebarAtom);
  const { isTrial, trialDaysLeft } = useTrial();
  const location = useLocation();
  const toggleAside = useToggleAside();
  const [workspace] = useAtom(workspaceAtom);
  const aiChatEnabled = workspace?.settings?.ai?.chat === true;

  const isPageRoute = location.pathname.includes("/p/");

  const items = links.map((link) => (
    <Link className={classes.link} key={link.label} to={link.link}>
      {t(link.label)}
    </Link>
  ));

  return (
    <>
      <Group h="100%" justify="space-between" px="md" wrap={"nowrap"}>
        <Group wrap="nowrap">
          <Tooltip label={t("Sidebar toggle")}>
            <SidebarToggle
              aria-label={t("Sidebar toggle")}
              hiddenFrom="sm"
              onClick={toggleMobile}
              opened={mobileOpened}
              size="sm"
            />
          </Tooltip>

          <Tooltip label={t("Sidebar toggle")}>
            <SidebarToggle
              aria-label={t("Sidebar toggle")}
              onClick={toggleDesktop}
              opened={desktopOpened}
              size="sm"
              visibleFrom="sm"
            />
          </Tooltip>

          <Link aria-label="Docmost" className={classes.brand} to="/home">
            <Box className={classes.brandIcon} hiddenFrom="sm">
              <img
                alt="Docmost"
                height={22}
                src="/icons/favicon-32x32.png"
                width={22}
              />
            </Box>
            <Text
              fw={600}
              size="lg"
              style={{ userSelect: "none" }}
              visibleFrom="sm"
            >
              Docmost
            </Text>
          </Link>

          <Group className={classes.links} gap={5} ml={50} visibleFrom="sm">
            {items}
          </Group>
        </Group>

        <div>
          <Group visibleFrom="sm">
            <SearchControl onClick={searchSpotlight.open} />
          </Group>
          <Group hiddenFrom="sm">
            <SearchMobileControl onSearch={searchSpotlight.open} />
          </Group>
        </div>

        <Group px={"xl"} wrap="nowrap">
          {aiChatEnabled && (
            <>
              <UnstyledButton
                className={classes.link}
                component={Link}
                onClick={(e: React.MouseEvent) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
                    return;
                  }
                  if (isPageRoute) {
                    e.preventDefault();
                    toggleAside("chat");
                  }
                }}
                to="/ai"
                visibleFrom="sm"
              >
                {t("AI Chat")}
              </UnstyledButton>
              <Tooltip label={t("AI Chat")} openDelay={250} withArrow>
                <ActionIcon
                  aria-label={t("AI Chat")}
                  color="dark"
                  component={Link}
                  hiddenFrom="sm"
                  onClick={(e: React.MouseEvent) => {
                    if (
                      e.metaKey ||
                      e.ctrlKey ||
                      e.shiftKey ||
                      e.button === 1
                    ) {
                      return;
                    }
                    if (isPageRoute) {
                      e.preventDefault();
                      toggleAside("chat");
                    }
                  }}
                  size="sm"
                  to="/ai"
                  variant="subtle"
                >
                  <IconSparkles size={20} stroke={2} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
          <NotificationPopover />
          {isCloud() && isTrial && trialDaysLeft !== 0 && (
            <Badge
              component={Link}
              style={{ cursor: "pointer" }}
              to={APP_ROUTE.SETTINGS.WORKSPACE.BILLING}
              variant="light"
              visibleFrom="xs"
            >
              {trialDaysLeft === 1
                ? "1 day left"
                : `${trialDaysLeft} days left`}
            </Badge>
          )}
          <TopMenu />
        </Group>
      </Group>
    </>
  );
}
