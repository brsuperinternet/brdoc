import { ActionIcon, Menu, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconCopy,
  IconDots,
  IconFileDescription,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  buildPageUrl,
  buildSharedPageUrl,
} from "@/features/page/page.utils.ts";
import { useDeleteShareMutation } from "@/features/share/queries/share-query.ts";
import { ISharedItem } from "@/features/share/types/share.types.ts";
import { useClipboard } from "@/hooks/use-clipboard";

interface Props {
  share: ISharedItem;
}
export default function ShareActionMenu({ share }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const clipboard = useClipboard();
  const deleteShareMutation = useDeleteShareMutation();

  const openPage = () => {
    const pageLink = buildPageUrl(
      share.space.slug,
      share.page.slugId,
      share.page.title
    );
    navigate(pageLink);
  };

  const copyLink = () => {
    const shareLink = buildSharedPageUrl({
      pageSlugId: share.page.slugId,
      pageTitle: share.page.title,
      shareId: share.key,
    });

    clipboard.copy(shareLink);
    notifications.show({ message: t("Link copied") });
  };
  const onDelete = async () => {
    deleteShareMutation.mutateAsync(share.key);
  };

  const openDeleteModal = () =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t("Are you sure you want to delete this shared link?")}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Don't"), confirm: t("Delete") },
      onConfirm: onDelete,
      title: t("Delete public share link"),
    });

  return (
    <>
      <Menu
        arrowPosition="center"
        offset={20}
        position="bottom-end"
        shadow="xl"
        width={200}
        withArrow
      >
        <Menu.Target>
          <ActionIcon aria-label={t("More options")} c="gray" variant="subtle">
            <IconDots size={20} stroke={2} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item leftSection={<IconCopy size={16} />} onClick={copyLink}>
            {t("Copy link")}
          </Menu.Item>

          <Menu.Item
            leftSection={<IconFileDescription size={16} />}
            onClick={openPage}
          >
            {t("Open page")}
          </Menu.Item>
          <Menu.Item
            c="red"
            disabled={share.space?.userRole === "reader"}
            leftSection={<IconTrash size={16} />}
            onClick={openDeleteModal}
          >
            {t("Delete share")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
