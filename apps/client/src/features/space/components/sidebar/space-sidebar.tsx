import {
  ActionIcon,
  Group,
  Menu,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconArrowDown,
  IconDots,
  IconEye,
  IconEyeOff,
  IconFileExport,
  IconHome,
  IconPlus,
  IconSearch,
  IconSettings,
  IconStar,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import ExportModal from "@/components/common/export-modal";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import {
  useAddFavoriteMutation,
  useFavoriteIds,
  useRemoveFavoriteMutation,
} from "@/features/favorite/queries/favorite-query";
import PageImportModal from "@/features/page/components/page-import-modal.tsx";
import SpaceTree from "@/features/page/tree/components/space-tree.tsx";
import { useTreeMutation } from "@/features/page/tree/hooks/use-tree-mutation.ts";
import { searchSpotlight } from "@/features/search/constants";
import SpaceSettingsModal from "@/features/space/components/settings-modal.tsx";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability.ts";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import {
  useSpaceWatchStatusQuery,
  useUnwatchSpaceMutation,
  useWatchSpaceMutation,
} from "@/features/space/queries/space-watcher-query.ts";
import { getSpaceUrl, isBetaPublicSpaces } from "@/lib/config.ts";
import classes from "./space-sidebar.module.css";
import { SwitchSpace } from "./switch-space";

export function SpaceSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [opened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);

  const spaceRules = space?.membership?.permissions;
  const spaceAbility = useSpaceAbility(spaceRules);
  const { handleCreate } = useTreeMutation(space?.id ?? "");

  if (!space) {
    return <></>;
  }

  function handleCreatePage() {
    handleCreate(null);
  }

  return (
    <>
      <div className={classes.navbar}>
        <div
          className={classes.section}
          style={{
            border: "none",
            marginBottom: 3,
            marginTop: 2,
          }}
        >
          <Group
            gap={4}
            justify="space-between"
            style={{ width: "100%" }}
            wrap="nowrap"
          >
            <SwitchSpace
              isPublished={isBetaPublicSpaces() && space?.isPublished}
              spaceIcon={space?.logo}
              spaceName={space?.name}
              spaceSlug={space?.slug}
            />
          </Group>
        </div>

        <div className={classes.section}>
          <div className={classes.menuItems}>
            <UnstyledButton
              className={clsx(
                classes.menu,
                location.pathname.toLowerCase() === getSpaceUrl(spaceSlug)
                  ? classes.activeButton
                  : ""
              )}
              component={Link}
              to={getSpaceUrl(spaceSlug)}
            >
              <div className={classes.menuItemInner}>
                <IconHome
                  className={classes.menuItemIcon}
                  size={18}
                  stroke={2}
                />
                <span>{t("Overview")}</span>
              </div>
            </UnstyledButton>

            <UnstyledButton
              className={classes.menu}
              onClick={searchSpotlight.open}
            >
              <div className={classes.menuItemInner}>
                <IconSearch
                  className={classes.menuItemIcon}
                  size={18}
                  stroke={2}
                />
                <span>{t("Search")}</span>
              </div>
            </UnstyledButton>

            <UnstyledButton className={classes.menu} onClick={openSettings}>
              <div className={classes.menuItemInner}>
                <IconSettings
                  className={classes.menuItemIcon}
                  size={18}
                  stroke={2}
                />
                <span>{t("Space settings")}</span>
              </div>
            </UnstyledButton>

            {spaceAbility.can(
              SpaceCaslAction.Manage,
              SpaceCaslSubject.Page
            ) && (
              <UnstyledButton
                className={classes.menu}
                onClick={() => {
                  handleCreatePage();
                  if (mobileSidebarOpened) {
                    toggleMobileSidebar();
                  }
                }}
              >
                <div className={classes.menuItemInner}>
                  <IconPlus
                    className={classes.menuItemIcon}
                    size={18}
                    stroke={2}
                  />
                  <span>{t("New page")}</span>
                </div>
              </UnstyledButton>
            )}
          </div>
        </div>

        <div className={clsx(classes.section, classes.sectionPages)}>
          <Group className={classes.pagesHeader} justify="space-between">
            <Text c="dimmed" fw={500} size="xs">
              {t("Pages")}
            </Text>

            <Group gap="xs">
              <SpaceMenu
                canManagePages={spaceAbility.can(
                  SpaceCaslAction.Manage,
                  SpaceCaslSubject.Page
                )}
                onSpaceSettings={openSettings}
                spaceId={space.id}
              />

              {spaceAbility.can(
                SpaceCaslAction.Manage,
                SpaceCaslSubject.Page
              ) && (
                <Tooltip label={t("Create page")} position="right" withArrow>
                  <ActionIcon
                    aria-label={t("Create page")}
                    onClick={handleCreatePage}
                    size={18}
                    variant="default"
                  >
                    <IconPlus />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Group>

          <div className={classes.pages}>
            <SpaceTree
              readOnly={spaceAbility.cannot(
                SpaceCaslAction.Manage,
                SpaceCaslSubject.Page
              )}
              spaceId={space.id}
            />
          </div>
        </div>
      </div>

      <SpaceSettingsModal
        onClose={closeSettings}
        opened={opened}
        spaceId={space?.slug}
      />
    </>
  );
}

interface SpaceMenuProps {
  canManagePages: boolean;
  onSpaceSettings: () => void;
  spaceId: string;
}
function SpaceMenu({
  spaceId,
  canManagePages,
  onSpaceSettings,
}: SpaceMenuProps) {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const [importOpened, { open: openImportModal, close: closeImportModal }] =
    useDisclosure(false);
  const [exportOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);

  const { data: watchStatus } = useSpaceWatchStatusQuery(spaceId);
  const watchMutation = useWatchSpaceMutation();
  const unwatchMutation = useUnwatchSpaceMutation();
  const isWatching = watchStatus?.watching ?? false;

  const favoriteIds = useFavoriteIds("space");
  const addFavoriteMutation = useAddFavoriteMutation();
  const removeFavoriteMutation = useRemoveFavoriteMutation();
  const isFavorited = favoriteIds.has(spaceId);

  const handleToggleFavorite = () => {
    const params = { spaceId, type: "space" as const };
    if (isFavorited) {
      removeFavoriteMutation.mutate(params);
    } else {
      addFavoriteMutation.mutate(params);
    }
  };

  const handleToggleWatch = () => {
    if (isWatching) {
      unwatchMutation.mutate(spaceId);
    } else {
      watchMutation.mutate(spaceId);
    }
  };

  return (
    <>
      <Menu shadow="md" width={200} withArrow>
        <Menu.Target>
          <Tooltip label={t("Space menu")} position="top" withArrow>
            <ActionIcon
              aria-label={t("Space menu")}
              size={18}
              variant="default"
            >
              <IconDots />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            leftSection={
              isFavorited ? (
                <IconStarFilled
                  color="var(--mantine-color-yellow-filled)"
                  size={16}
                />
              ) : (
                <IconStar size={16} />
              )
            }
            onClick={handleToggleFavorite}
          >
            {isFavorited ? t("Remove from favorites") : t("Add to favorites")}
          </Menu.Item>

          <Menu.Item
            leftSection={
              isWatching ? <IconEyeOff size={16} /> : <IconEye size={16} />
            }
            onClick={handleToggleWatch}
          >
            {isWatching ? t("Stop watching space") : t("Watch space")}
          </Menu.Item>

          {canManagePages && (
            <>
              <Menu.Divider />

              <Menu.Item
                leftSection={<IconArrowDown size={16} />}
                onClick={openImportModal}
              >
                {t("Import pages")}
              </Menu.Item>

              <Menu.Item
                leftSection={<IconFileExport size={16} />}
                onClick={openExportModal}
              >
                {t("Export space")}
              </Menu.Item>

              <Menu.Divider />

              <Menu.Item
                leftSection={<IconSettings size={16} />}
                onClick={onSpaceSettings}
              >
                {t("Space settings")}
              </Menu.Item>

              <Menu.Item
                component={Link}
                leftSection={<IconTrash size={16} />}
                to={`/s/${spaceSlug}/trash`}
              >
                {t("Trash")}
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>

      {canManagePages && (
        <>
          <PageImportModal
            onClose={closeImportModal}
            open={importOpened}
            spaceId={spaceId}
          />

          <ExportModal
            onClose={closeExportModal}
            open={exportOpened}
            type="space"
          />
        </>
      )}
    </>
  );
}
