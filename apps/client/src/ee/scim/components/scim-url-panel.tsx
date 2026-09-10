import { Group, Stack, Text, TextInput } from "@mantine/core";
import { useTranslation } from "react-i18next";
import CopyTextButton from "@/components/common/copy.tsx";

export function ScimUrlPanel() {
  const { t } = useTranslation();
  const scimUrl = `${window.location.origin}/api/scim/v2`;

  return (
    <Stack gap="xs">
      <Text fw={500} size="sm">
        {t("SCIM endpoint URL")}
      </Text>
      <Text c="dimmed" size="xs">
        {t(
          "Configure your identity provider with this URL to provision users and groups."
        )}
      </Text>
      <Group gap="xs" wrap="nowrap">
        <TextInput
          readOnly
          style={{ flex: 1 }}
          value={scimUrl}
          variant="filled"
        />
        <CopyTextButton text={scimUrl} />
      </Group>
    </Stack>
  );
}
