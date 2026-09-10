import { ActionIcon, Menu, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconCopy, IconDots, IconSend, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  useResendInvitationMutation,
  useRevokeInvitationMutation,
} from "@/features/workspace/queries/workspace-query.ts";
import { getInviteLink } from "@/features/workspace/services/workspace-service.ts";
import { useClipboard } from "@/hooks/use-clipboard";
import useUserRole from "@/hooks/use-user-role.tsx";
import { isCloud } from "@/lib/config.ts";

interface Props {
  invitationId: string;
}
export default function InviteActionMenu({ invitationId }: Props) {
  const { t } = useTranslation();
  const resendInvitationMutation = useResendInvitationMutation();
  const revokeInvitationMutation = useRevokeInvitationMutation();
  const { isAdmin } = useUserRole();
  const clipboard = useClipboard();

  const handleCopyLink = async (invitationId: string) => {
    try {
      const link = await getInviteLink({ invitationId });
      const url = new URL(link.inviteLink);
      const inviteLink = `${window.location.origin}${url.pathname}${url.search}`;
      clipboard.copy(inviteLink);
      notifications.show({ message: t("Link copied") });
    } catch (err) {
      notifications.show({
        color: "red",
        message: err["response"]?.data?.message,
      });
    }
  };

  const onResend = async () => {
    await resendInvitationMutation.mutateAsync({ invitationId });
  };

  const onRevoke = async () => {
    await revokeInvitationMutation.mutateAsync({ invitationId });
  };

  const openRevokeModal = () =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to revoke this invitation? The user will not be able to join the workspace."
          )}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Don't"), confirm: t("Revoke") },
      onConfirm: onRevoke,
      title: t("Revoke invitation"),
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
            aria-label={t("Invite actions")}
            c="gray"
            variant="subtle"
          >
            <IconDots size={20} stroke={2} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          {!isCloud() && (
            <Menu.Item
              disabled={!isAdmin}
              leftSection={<IconCopy size={16} />}
              onClick={() => handleCopyLink(invitationId)}
            >
              {t("Copy link")}
            </Menu.Item>
          )}

          <Menu.Item
            disabled={!isAdmin}
            leftSection={<IconSend size={16} />}
            onClick={onResend}
          >
            {t("Resend invitation")}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            c="red"
            disabled={!isAdmin}
            leftSection={<IconTrash size={16} />}
            onClick={openRevokeModal}
          >
            {t("Revoke invitation")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
