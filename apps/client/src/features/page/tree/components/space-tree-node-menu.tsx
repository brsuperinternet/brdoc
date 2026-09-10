import { ActionIcon, Menu, rem } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconArrowRight,
  IconCopy,
  IconDotsVertical,
  IconFileExport,
  IconLink,
  IconStar,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import ExportModal from "@/components/common/export-modal";
import {
  useAddFavoriteMutation,
  useFavoriteIds,
  useRemoveFavoriteMutation,
} from "@/features/favorite/queries/favorite-query";
import CopyPageModal from "@/features/page/components/copy-page-modal.tsx";
import MovePageModal from "@/features/page/components/move-page-modal.tsx";
import { useDeletePageModal } from "@/features/page/hooks/use-delete-page-modal.tsx";
import { getPageTitle } from "@/features/page/page.utils";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { duplicatePage } from "@/features/page/services/page-service.ts";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom.ts";
import { useTreeMutation } from "@/features/page/tree/hooks/use-tree-mutation.ts";
import { treeModel } from "@/features/page/tree/model/tree-model";
import classes from "@/features/page/tree/styles/tree.module.css";
import type { SpaceTreeNode } from "@/features/page/tree/types.ts";
import {
  spaceRoots,
  updateSpaceRoots,
} from "@/features/page/tree/utils/utils.ts";
import { useQueryEmit } from "@/features/websocket/use-query-emit.ts";
import { useClipboard } from "@/hooks/use-clipboard";
import { getAppUrl } from "@/lib/config.ts";

export interface NodeMenuProps {
  canEdit: boolean;
  node: SpaceTreeNode;
}

export function NodeMenu({ node, canEdit }: NodeMenuProps) {
  const { t } = useTranslation();
  const clipboard = useClipboard({ timeout: 500 });
  const { spaceSlug } = useParams();
  const { openDeleteModal } = useDeletePageModal();
  const { handleDelete } = useTreeMutation(node.spaceId);
  const [data, setData] = useAtom(treeDataAtom);
  const emit = useQueryEmit();
  const [exportOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);
  const [
    movePageModalOpened,
    { open: openMovePageModal, close: closeMoveSpaceModal },
  ] = useDisclosure(false);
  const [
    copyPageModalOpened,
    { open: openCopyPageModal, close: closeCopySpaceModal },
  ] = useDisclosure(false);
  const favoriteIds = useFavoriteIds("page", node.spaceId);
  const addFavorite = useAddFavoriteMutation();
  const removeFavorite = useRemoveFavoriteMutation();
  const isFavorited = favoriteIds.has(node.id);

  const handleCopyLink = () => {
    const pageUrl =
      getAppUrl() + buildPageUrl(spaceSlug, node.slugId, node.name);
    clipboard.copy(pageUrl);
    notifications.show({ message: t("Link copied") });
  };

  const handleDuplicatePage = async () => {
    try {
      const duplicatedPage = await duplicatePage({ pageId: node.id });

      // figure out parent + insertion index
      const siblings = treeModel.siblingsOf(
        spaceRoots(data, node.spaceId),
        node.id
      );
      const parentId = siblings?.parentId ?? null;
      const currentIndex = siblings?.index ?? 0;
      const newIndex = currentIndex + 1;

      const treeNodeData: SpaceTreeNode = {
        canEdit: true,
        children: [],
        hasChildren: duplicatedPage.hasChildren,
        icon: duplicatedPage.icon,
        id: duplicatedPage.id,
        name: duplicatedPage.title,
        parentPageId: duplicatedPage.parentPageId,
        position: duplicatedPage.position,
        slugId: duplicatedPage.slugId,
        spaceId: duplicatedPage.spaceId,
      };

      setData((prev) =>
        updateSpaceRoots(prev, node.spaceId, (roots) =>
          treeModel.insert(roots, parentId, treeNodeData, newIndex)
        )
      );

      setTimeout(() => {
        emit({
          operation: "addTreeNode",
          payload: {
            data: treeNodeData,
            index: newIndex,
            parentId,
          },
          spaceId: node.spaceId,
        });
      }, 50);

      notifications.show({ message: t("Page duplicated successfully") });
    } catch (err: any) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message || "An error occurred",
      });
    }
  };

  return (
    <>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <ActionIcon
            aria-label={t("Page menu for {{name}}", {
              name: getPageTitle(node.name, node.isBase, t),
            })}
            className={classes.actionIcon}
            color="gray"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            tabIndex={-1}
            variant="subtle"
          >
            <IconDotsVertical
              stroke={2}
              style={{ height: rem(20), width: rem(20) }}
            />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconLink size={16} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCopyLink();
            }}
          >
            {t("Copy link")}
          </Menu.Item>

          <Menu.Item
            leftSection={
              isFavorited ? (
                <IconStarFilled size={16} />
              ) : (
                <IconStar size={16} />
              )
            }
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isFavorited) {
                removeFavorite.mutate({ pageId: node.id, type: "page" });
              } else {
                addFavorite.mutate({ pageId: node.id, type: "page" });
              }
            }}
          >
            {isFavorited ? t("Remove from favorites") : t("Add to favorites")}
          </Menu.Item>

          <Menu.Item
            leftSection={<IconFileExport size={16} />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openExportModal();
            }}
          >
            {t("Export page")}
          </Menu.Item>

          {canEdit && (
            <>
              <Menu.Item
                leftSection={<IconCopy size={16} />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDuplicatePage();
                }}
              >
                {t("Duplicate")}
              </Menu.Item>

              <Menu.Item
                leftSection={<IconArrowRight size={16} />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openMovePageModal();
                }}
              >
                {t("Move")}
              </Menu.Item>

              <Menu.Item
                leftSection={<IconCopy size={16} />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openCopyPageModal();
                }}
              >
                {t("Copy to space")}
              </Menu.Item>

              <Menu.Divider />
              <Menu.Item
                c="red"
                leftSection={<IconTrash size={16} />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openDeleteModal({
                    onConfirm: () => handleDelete(node.id),
                  });
                }}
              >
                {t("Move to trash")}
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>

      <MovePageModal
        currentSpaceSlug={spaceSlug}
        onClose={closeMoveSpaceModal}
        open={movePageModalOpened}
        pageId={node.id}
        slugId={node.slugId}
      />

      <CopyPageModal
        currentSpaceSlug={spaceSlug}
        onClose={closeCopySpaceModal}
        open={copyPageModalOpened}
        pageId={node.id}
      />

      <ExportModal
        id={node.id}
        onClose={closeExportModal}
        open={exportOpened}
        type="page"
      />
    </>
  );
}
