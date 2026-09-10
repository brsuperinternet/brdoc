import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import CopyTextButton from "@/components/common/copy.tsx";
import { IApiKey } from "@/ee/api-key";

interface ApiKeyCreatedModalProps {
  apiKey: IApiKey;
  onClose: () => void;
  opened: boolean;
}

export function ApiKeyCreatedModal({
  opened,
  onClose,
  apiKey,
}: ApiKeyCreatedModalProps) {
  const { t } = useTranslation();

  if (!apiKey) {
    return null;
  }

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      size="lg"
      title={t("{{credential}} created", { credential: t("API key") })}
    >
      <Stack gap="md">
        <Alert
          color="red"
          icon={<IconAlertTriangle size={16} />}
          title={t("Important")}
        >
          {t(
            "Make sure to copy your {{credential}} now. You won't be able to see it again!",
            { credential: t("API key") }
          )}
        </Alert>

        <div>
          <Text fw={500} mb="xs" size="sm">
            {t("API key")}
          </Text>
          <Group gap="xs" wrap="nowrap">
            <TextInput
              readOnly
              style={{
                flex: 1,
              }}
              value={apiKey.token}
              variant="filled"
            />

            <CopyTextButton text={apiKey.token} />
          </Group>
        </div>

        <Button fullWidth mt="md" onClick={onClose}>
          {t("I've saved my {{credential}}", { credential: t("API key") })}
        </Button>
      </Stack>
    </Modal>
  );
}
