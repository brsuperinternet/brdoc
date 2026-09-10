import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IApiKey } from "@/ee/api-key";
import { useRevokeApiKeyMutation } from "@/ee/api-key/queries/api-key-query.ts";

interface RevokeApiKeyModalProps {
  apiKey: IApiKey | null;
  onClose: () => void;
  opened: boolean;
}

export function RevokeApiKeyModal({
  opened,
  onClose,
  apiKey,
}: RevokeApiKeyModalProps) {
  const { t } = useTranslation();
  const revokeApiKeyMutation = useRevokeApiKeyMutation();

  const handleRevoke = async () => {
    if (!apiKey) {
      return;
    }
    await revokeApiKeyMutation.mutateAsync({
      apiKeyId: apiKey.id,
    });
    onClose();
  };

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      size="md"
      title={t("Revoke {{credential}}", { credential: t("API key") })}
    >
      <Stack gap="md">
        <Text>
          {t("Are you sure you want to revoke this {{credential}}", {
            credential: t("API key"),
          })}{" "}
          <strong>{apiKey?.name}</strong>?
        </Text>
        <Text c="dimmed" size="sm">
          {t(
            "This action cannot be undone. Any applications using this API key will stop working."
          )}
        </Text>

        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} variant="default">
            {t("Cancel")}
          </Button>
          <Button
            color="red"
            loading={revokeApiKeyMutation.isPending}
            onClick={handleRevoke}
          >
            {t("Revoke")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
