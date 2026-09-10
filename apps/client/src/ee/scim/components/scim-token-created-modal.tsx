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
import { IScimToken } from "@/ee/scim/types/scim-token.types";

interface ScimTokenCreatedModalProps {
  onClose: () => void;
  opened: boolean;
  scimToken: IScimToken | null;
}

export function ScimTokenCreatedModal({
  opened,
  onClose,
  scimToken,
}: ScimTokenCreatedModalProps) {
  const { t } = useTranslation();
  if (!scimToken) {
    return null;
  }

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      size="lg"
      title={t("{{credential}} created", { credential: t("SCIM token") })}
    >
      <Stack gap="md">
        <Alert
          color="red"
          icon={<IconAlertTriangle size={16} />}
          title={t("Important")}
        >
          {t(
            "Make sure to copy your {{credential}} now. You won't be able to see it again!",
            { credential: t("SCIM token") }
          )}
        </Alert>

        <div>
          <Text fw={500} mb="xs" size="sm">
            {t("SCIM token")}
          </Text>
          <Group gap="xs" wrap="nowrap">
            <TextInput
              readOnly
              style={{ flex: 1 }}
              value={scimToken.token}
              variant="filled"
            />
            <CopyTextButton text={scimToken.token} />
          </Group>
        </div>

        <Button fullWidth mt="md" onClick={onClose}>
          {t("I've saved my {{credential}}", { credential: t("SCIM token") })}
        </Button>
      </Stack>
    </Modal>
  );
}
