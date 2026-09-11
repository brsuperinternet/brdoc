import {
  Divider,
  Modal,
  ScrollArea,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconHome,
  IconLayoutGrid,
  IconSettings,
  IconStar,
  IconUserPlus,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { AvatarIconType } from "@/features/attachments/types/attachment.types";
import { useFavoritesQuery } from "@/features/favorite/queries/favorite-query";
import { WorkspaceInviteForm } from "@/features/workspace/components/members/components/workspace-invite-form";
import { getSpaceUrl } from "@/lib/config";
import classes from "./global-sidebar.module.css";

export default function GlobalSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [active, setActive] = useState(location.pathname);
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  const mainNavItems = [
    { icon: IconHome, label: "Home", path: "/home" },
    { icon: IconStar, label: "Favorites", path: "/favorites" },
    { icon: IconLayoutGrid, label: "Spaces", path: "/spaces" },
  ];
  const { data: favoriteSpacesData, isPending: isFavoritesPending } =
    useFavoritesQuery("space");
  const favoriteSpaces =
    favoriteSpacesData?.pages.flatMap((p: any) => p.items) ?? [];
  const sortedFavoriteSpaces = [...favoriteSpaces]
    .filter((fav) => fav.space)
    .sort((a, b) => {
      const cmp = (a.space.name ?? "").localeCompare(
        b.space.name ?? "",
        undefined,
        { sensitivity: "base" }
      );
      return cmp === 0 ? a.id.localeCompare(b.id) : cmp;
    });
  const [inviteOpened, { open: openInvite, close: closeInvite }] =
    useDisclosure(false);

  useEffect(() => {
    setActive(location.pathname);
  }, [location.pathname]);

  const handleNavClick = () => {
    if (mobileSidebarOpened) {
      toggleMobileSidebar();
    }
  };

  return (
    <div className={classes.navbar}>
      <ScrollArea style={{ flex: 1 }} w="100%">
        <div className={classes.section}>
          {mainNavItems.map((item) => (
            <Link
              aria-current={active === item.path ? "page" : undefined}
              className={classes.link}
              data-active={active === item.path || undefined}
              key={item.label}
              onClick={handleNavClick}
              to={item.path}
            >
              <item.icon className={classes.linkIcon} stroke={2} />
              <span>{t(item.label)}</span>
            </Link>
          ))}
        </div>

        <Divider my="xs" />
        <div className={classes.section}>
          <Text className={classes.sectionHeader} component="h2">
            {t("Favorite spaces")}
          </Text>
          {!isFavoritesPending && sortedFavoriteSpaces.length === 0 ? (
            <Text c="dimmed" pl="xs" py={4} size="xs">
              {t("Favorite spaces appear here")}
            </Text>
          ) : (
            <>
              {sortedFavoriteSpaces.slice(0, 10).map((fav) => (
                <Link
                  className={classes.spaceItem}
                  key={fav.id}
                  onClick={handleNavClick}
                  to={getSpaceUrl(fav.space.slug)}
                >
                  <CustomAvatar
                    avatarUrl={fav.space.logo}
                    color="initials"
                    name={fav.space.name}
                    size={20}
                    type={AvatarIconType.SPACE_ICON}
                    variant="filled"
                  />
                  <Text fw={500} lineClamp={1} size="sm">
                    {fav.space.name}
                  </Text>
                </Link>
              ))}
              {sortedFavoriteSpaces.length > 10 && (
                <Link
                  className={classes.spaceItem}
                  onClick={handleNavClick}
                  to="/spaces"
                >
                  <Text c="dimmed" size="xs">
                    {t("View all")}
                  </Text>
                </Link>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className={classes.bottomSection}>
        <UnstyledButton className={classes.link} onClick={openInvite}>
          <IconUserPlus className={classes.linkIcon} stroke={2} />
          <span>{t("Invite People")}</span>
        </UnstyledButton>
        <Link
          aria-current={active.startsWith("/settings") ? "page" : undefined}
          className={classes.link}
          data-active={active.startsWith("/settings") || undefined}
          onClick={handleNavClick}
          to="/settings/account/profile"
        >
          <IconSettings className={classes.linkIcon} stroke={2} />
          <span>{t("Settings")}</span>
        </Link>
      </div>

      <Modal
        centered
        onClose={closeInvite}
        opened={inviteOpened}
        size="550"
        title={t("Invite new members")}
      >
        <Divider mb="xs" size="xs" />
        <ScrollArea h="80%">
          <WorkspaceInviteForm onClose={closeInvite} />
        </ScrollArea>
      </Modal>
    </div>
  );
}
