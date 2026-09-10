import { Alert, Button, Stack, Text, TextInput } from "@mantine/core";
import { IconAlertCircle, IconKey } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface MfaBackupCodeInputProps {
  error?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
}

export function MfaBackupCodeInput({
  value,
  onChange,
  error,
  onSubmit,
  onCancel,
  isLoading,
}: MfaBackupCodeInputProps) {
  const { t } = useTranslation();

  return (
    <Stack>
      <Alert color="blue" icon={<IconAlertCircle size={16} />} variant="light">
        <Text size="sm">
          {t(
            "Enter one of your backup codes. Each backup code can only be used once."
          )}
        </Text>
      </Alert>

      <TextInput
        autoFocus
        data-autofocus
        error={error}
        label={t("Backup code")}
        maxLength={8}
        onChange={(e) => onChange(e.currentTarget.value.toUpperCase())}
        placeholder="XXXXXXXX"
        styles={{
          input: {
            fontFamily: "monospace",
            fontSize: "1rem",
            letterSpacing: "0.1em",
          },
        }}
        value={value}
      />

      <Stack>
        <Button
          fullWidth
          leftSection={<IconKey size={18} />}
          loading={isLoading}
          onClick={onSubmit}
          size="md"
        >
          {t("Verify backup code")}
        </Button>

        <Button
          color="gray"
          disabled={isLoading}
          fullWidth
          onClick={onCancel}
          variant="subtle"
        >
          {t("Use authenticator app instead")}
        </Button>
      </Stack>
    </Stack>
  );
}
