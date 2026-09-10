import {
  Alert,
  Button,
  Code,
  Group,
  List,
  Modal,
  Paper,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconRefresh,
} from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { CopyButton } from "@/components/common/copy-button";
import { regenerateBackupCodes } from "@/ee/mfa";
import useCurrentUser from "@/features/user/hooks/use-current-user";

interface MfaBackupCodesModalProps {
  onClose: () => void;
  opened: boolean;
}

export function MfaBackupCodesModal({
  opened,
  onClose,
}: MfaBackupCodesModalProps) {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showNewCodes, setShowNewCodes] = useState(false);
  const requiresPassword = !currentUser?.user?.hasGeneratedPassword;

  const formSchema = requiresPassword
    ? z.object({
        confirmPassword: z.string().min(1, { message: "Password is required" }),
      })
    : z.object({
        confirmPassword: z.string().optional(),
      });

  const form = useForm({
    initialValues: {
      confirmPassword: "",
    },
    validate: zod4Resolver(formSchema),
  });

  const regenerateMutation = useMutation({
    mutationFn: (data: { confirmPassword?: string }) =>
      regenerateBackupCodes(data),
    onError: (error: any) => {
      notifications.show({
        color: "red",
        message:
          error.response?.data?.message ||
          t("Failed to regenerate backup codes"),
        title: t("Error"),
      });
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowNewCodes(true);
      form.reset();
      notifications.show({
        message: t("New backup codes have been generated"),
        title: t("Success"),
      });
    },
  });

  const handleRegenerate = (values: { confirmPassword?: string }) => {
    // Only send confirmPassword if it's required (non-SSO users)
    const payload = requiresPassword
      ? { confirmPassword: values.confirmPassword }
      : {};
    regenerateMutation.mutate(payload);
  };

  const handleClose = () => {
    setShowNewCodes(false);
    setBackupCodes([]);
    form.reset();
    onClose();
  };

  return (
    <Modal
      onClose={handleClose}
      opened={opened}
      size="md"
      title={t("Backup codes")}
    >
      <Stack gap="md">
        {showNewCodes ? (
          <>
            <Alert
              color="yellow"
              icon={<IconAlertCircle size={20} />}
              title={t("Save your new backup codes")}
            >
              <Text size="sm">
                {t(
                  "Make sure to save these codes in a secure place. Your old backup codes are no longer valid."
                )}
              </Text>
            </Alert>

            <Paper p="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">
                  {t("Your new backup codes")}
                </Text>
                <CopyButton value={backupCodes.join("\n")}>
                  {({ copied, copy }) => (
                    <Button
                      leftSection={
                        copied ? (
                          <IconCheck size={14} />
                        ) : (
                          <IconCopy size={14} />
                        )
                      }
                      onClick={copy}
                      size="xs"
                      variant="subtle"
                    >
                      {copied ? t("Copied") : t("Copy")}
                    </Button>
                  )}
                </CopyButton>
              </Group>
              <List size="sm" spacing="xs">
                {backupCodes.map((code, index) => (
                  <List.Item key={index}>
                    <Code>{code}</Code>
                  </List.Item>
                ))}
              </List>
            </Paper>

            <Button
              fullWidth
              leftSection={<IconCheck size={18} />}
              onClick={handleClose}
            >
              {t("I've saved my backup codes")}
            </Button>
          </>
        ) : (
          <form onSubmit={form.onSubmit(handleRegenerate)}>
            <Stack gap="md">
              <Alert
                color="blue"
                icon={<IconAlertCircle size={20} />}
                title={t("About backup codes")}
                variant="light"
              >
                <Text size="sm">
                  {t(
                    "Backup codes can be used to access your account if you lose access to your authenticator app. Each code can only be used once."
                  )}
                </Text>
              </Alert>

              <Text size="sm">
                {t(
                  "You can regenerate new backup codes at any time. This will invalidate all existing codes."
                )}
              </Text>

              {requiresPassword && (
                <PasswordInput
                  label={t("Confirm password")}
                  placeholder={t("Enter your password")}
                  variant="filled"
                  visibilityToggleButtonProps={{
                    "aria-hidden": false,
                    "aria-label": t("Toggle password visibility"),
                    tabIndex: 0,
                  }}
                  {...form.getInputProps("confirmPassword")}
                  autoFocus
                  data-autofocus
                />
              )}

              <Button
                fullWidth
                leftSection={<IconRefresh size={18} />}
                loading={regenerateMutation.isPending}
                type="submit"
              >
                {t("Generate new backup codes")}
              </Button>
            </Stack>
          </form>
        )}
      </Stack>
    </Modal>
  );
}
