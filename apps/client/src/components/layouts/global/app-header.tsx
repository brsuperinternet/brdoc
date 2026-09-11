import { Box, Group, Text, Tooltip } from "@mantine/core";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  desktopSidebarAtom,
  mobileSidebarAtom,
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import TopMenu from "@/components/layouts/global/top-menu.tsx";
import SidebarToggle from "@/components/ui/sidebar-toggle-button.tsx";
import { NotificationPopover } from "@/features/notification/components/notification-popover.tsx";
import {
  SearchControl,
  SearchMobileControl,
} from "@/features/search/components/search-control.tsx";
import { searchSpotlight } from "@/features/search/constants.ts";
import APP_ROUTE from "@/lib/app-route.ts";
import classes from "./app-header.module.css";

const links = [{ label: "Home", link: APP_ROUTE.HOME }];

export function AppHeader() {
  const { t } = useTranslation();
  const [mobileOpened] = useAtom(mobileSidebarAtom);
  const toggleMobile = useToggleSidebar(mobileSidebarAtom);

  const [desktopOpened] = useAtom(desktopSidebarAtom);
  const toggleDesktop = useToggleSidebar(desktopSidebarAtom);

  const items = links.map((link) => (
    <Link className={classes.link} key={link.label} to={link.link}>
      {t(link.label)}
    </Link>
  ));

  return (
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
        <NotificationPopover />
        <TopMenu />
      </Group>
    </Group>
  );
}
