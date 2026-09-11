import { ActionIcon, Menu } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconDots, IconEdit, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

type CommentMenuProps = {
  onEditComment: () => void;
  onDeleteComment: () => void;
  canEdit?: boolean;
};

function CommentMenu({
  onEditComment,
  onDeleteComment,
  canEdit = true,
}: CommentMenuProps) {
  const { t } = useTranslation();

  const openDeleteModal = () =>
    modals.openConfirmModal({
      centered: true,
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Delete") },
      onConfirm: onDeleteComment,
      title: t("Are you sure you want to delete this comment?"),
    });

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon
          aria-label={t("Comment menu")}
          style={{ border: "none" }}
          variant="default"
        >
          <IconDots size={20} stroke={2} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {canEdit && (
          <Menu.Item
            leftSection={<IconEdit size={14} />}
            onClick={onEditComment}
          >
            {t("Edit comment")}
          </Menu.Item>
        )}

        <Menu.Item
          leftSection={<IconTrash size={14} />}
          onClick={openDeleteModal}
        >
          {t("Delete comment")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default CommentMenu;
