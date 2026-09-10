import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconCircleCheck,
  IconCircleCheckFilled,
  IconDots,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";

type CommentMenuProps = {
  onEditComment: () => void;
  onDeleteComment: () => void;
  onResolveComment?: () => void;
  canEdit?: boolean;
  isResolved?: boolean;
  isParentComment?: boolean;
};

function CommentMenu({
  onEditComment,
  onDeleteComment,
  onResolveComment,
  canEdit = true,
  isResolved = false,
  isParentComment = false,
}: CommentMenuProps) {
  const { t } = useTranslation();
  const canResolve = useHasFeature(Feature.COMMENT_RESOLUTION);
  const upgradeLabel = useUpgradeLabel();

  //@ts-expect-error
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
        {isParentComment &&
          (canResolve ? (
            <Menu.Item
              leftSection={
                isResolved ? (
                  <IconCircleCheckFilled size={14} />
                ) : (
                  <IconCircleCheck size={14} />
                )
              }
              onClick={onResolveComment}
            >
              {isResolved ? t("Re-open comment") : t("Resolve comment")}
            </Menu.Item>
          ) : (
            <Tooltip label={upgradeLabel} position="left" withinPortal={false}>
              <Menu.Item disabled leftSection={<IconCircleCheck size={14} />}>
                {t("Resolve comment")}
              </Menu.Item>
            </Tooltip>
          ))}
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
