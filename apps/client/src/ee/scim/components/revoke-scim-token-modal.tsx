import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useRevokeScimTokenMutation } from "@/ee/scim/queries/scim-token-query";
import { IScimToken } from "@/ee/scim/types/scim-token.types";

interface RevokeScimTokenModalProps {
  onClose: () => void;
  opened: boolean;
  scimToken: IScimToken | null;
}

export function RevokeScimTokenModal({
  opened,
  onClose,
  scimToken,
}: RevokeScimTokenModalProps) {
  const { t } = useTranslation();
  const revokeMutation = useRevokeScimTokenMutation();

  const handleRevoke = async () => {
    if (!scimToken) {
      return;
    }
    await revokeMutation.mutateAsync({ tokenId: scimToken.id });
    onClose();
  };

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      size="md"
      title={t("Revoke {{credential}}", { credential: t("SCIM token") })}
    >
      <Stack gap="md">
        <Text>
          {t("Are you sure you want to revoke this {{credential}}", {
            credential: t("SCIM token"),
          })}{" "}
          <strong>{scimToken?.name}</strong>?
        </Text>
        <Text c="dimmed" size="sm">
          {t(
            "This action cannot be undone. Your identity provider will stop syncing immediately."
          )}
        </Text>

        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} variant="default">
            {t("Cancel")}
          </Button>
          <Button
            color="red"
            loading={revokeMutation.isPending}
            onClick={handleRevoke}
          >
            {t("Revoke")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
