import {
  Alert,
  Button,
  Modal,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconShieldOff } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { disableMfa } from "@/ee/mfa";
import useCurrentUser from "@/features/user/hooks/use-current-user";

interface MfaDisableModalProps {
  onClose: () => void;
  onComplete: () => void;
  opened: boolean;
}

export function MfaDisableModal({
  opened,
  onClose,
  onComplete,
}: MfaDisableModalProps) {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
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

  const disableMutation = useMutation({
    mutationFn: disableMfa,
    onError: (error: any) => {
      notifications.show({
        color: "red",
        message: error.response?.data?.message || t("Failed to disable MFA"),
        title: t("Error"),
      });
    },
    onSuccess: () => {
      onComplete();
    },
  });

  const handleSubmit = async (values: { confirmPassword?: string }) => {
    // Only send confirmPassword if it's required (non-SSO users)
    const payload = requiresPassword
      ? { confirmPassword: values.confirmPassword }
      : {};
    await disableMutation.mutateAsync(payload);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      onClose={handleClose}
      opened={opened}
      size="md"
      title={t("Disable two-factor authentication")}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert
            color="red"
            icon={<IconAlertTriangle size={20} />}
            title={t("Warning")}
            variant="light"
          >
            <Text size="sm">
              {t(
                "Disabling two-factor authentication will make your account less secure. You'll only need your password to sign in."
              )}
            </Text>
          </Alert>

          {requiresPassword && (
            <>
              <Text size="sm">
                {t(
                  "Please enter your password to disable two-factor authentication:"
                )}
              </Text>

              <PasswordInput
                label={t("Password")}
                placeholder={t("Enter your password")}
                visibilityToggleButtonProps={{
                  "aria-hidden": false,
                  "aria-label": t("Toggle password visibility"),
                  tabIndex: 0,
                }}
                {...form.getInputProps("confirmPassword")}
                autoFocus
                data-autofocus
              />
            </>
          )}

          <Stack gap="sm">
            <Button
              color="red"
              fullWidth
              leftSection={<IconShieldOff size={18} />}
              loading={disableMutation.isPending}
              type="submit"
            >
              {t("Disable two-factor authentication")}
            </Button>
            <Button
              disabled={disableMutation.isPending}
              fullWidth
              onClick={handleClose}
              variant="default"
            >
              {t("Cancel")}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Modal>
  );
}
