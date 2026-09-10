import { ActionIcon, Menu, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import {
  IconDots,
  IconTrash,
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  useActivateWorkspaceMemberMutation,
  useDeactivateWorkspaceMemberMutation,
  useDeleteWorkspaceMemberMutation,
} from "@/features/workspace/queries/workspace-query.ts";
import useUserRole from "@/hooks/use-user-role.tsx";

interface Props {
  deactivatedAt: Date | null;
  name: string;
  userId: string;
}
export default function MemberActionMenu({
  userId,
  name,
  deactivatedAt,
}: Props) {
  const { t } = useTranslation();
  const deleteWorkspaceMemberMutation = useDeleteWorkspaceMemberMutation();
  const deactivateMutation = useDeactivateWorkspaceMemberMutation();
  const activateMutation = useActivateWorkspaceMemberMutation();
  const { isAdmin } = useUserRole();

  const isDeactivated = !!deactivatedAt;

  const onDeactivate = async () => {
    await deactivateMutation.mutateAsync({ userId });
  };

  const onActivate = async () => {
    await activateMutation.mutateAsync({ userId });
  };

  const openDeactivateModal = () =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {isDeactivated
            ? t("Are you sure you want to activate this workspace member?")
            : t(
                "Are you sure you want to deactivate this workspace member? They will no longer be able to access this workspace."
              )}
        </Text>
      ),
      confirmProps: { color: isDeactivated ? "blue" : "orange" },
      labels: {
        cancel: t("Cancel"),
        confirm: isDeactivated ? t("Activate") : t("Deactivate"),
      },
      onConfirm: isDeactivated ? onActivate : onDeactivate,
      title: isDeactivated ? t("Activate member") : t("Deactivate member"),
    });

  const onRevoke = async () => {
    await deleteWorkspaceMemberMutation.mutateAsync({ userId });
  };

  const openRevokeModal = () =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to delete this workspace member? This action is irreversible."
          )}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Don't"), confirm: t("Delete") },
      onConfirm: onRevoke,
      title: t("Delete member"),
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
          <ActionIcon
            aria-label={t("Member actions for {{name}}", { name })}
            c="gray"
            variant="subtle"
          >
            <IconDots size={20} stroke={2} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            disabled={!isAdmin}
            leftSection={
              isDeactivated ? (
                <IconUserCheck size={16} />
              ) : (
                <IconUserOff size={16} />
              )
            }
            onClick={openDeactivateModal}
          >
            {isDeactivated ? t("Activate member") : t("Deactivate member")}
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            c="red"
            disabled={!isAdmin}
            leftSection={<IconTrash size={16} />}
            onClick={openRevokeModal}
          >
            {t("Delete member")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
