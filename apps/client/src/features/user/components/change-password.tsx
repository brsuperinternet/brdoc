import { Button, Group, Modal, PasswordInput, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { changePassword } from "@/features/auth/services/auth-service.ts";

export default function ChangePassword() {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text size="md">{t("Password")}</Text>
        <Text c="dimmed" size="sm">
          {t("You can change your password here.")}
        </Text>
      </div>

      <Button onClick={open} style={{ whiteSpace: "nowrap" }} variant="default">
        {t("Change password")}
      </Button>

      <Modal
        centered
        onClose={close}
        opened={opened}
        title={t("Change password")}
      >
        <Text mb="md">
          {t("Your password must be a minimum of 8 characters.")}
        </Text>
        <ChangePasswordForm onClose={close} />
      </Modal>
    </Group>
  );
}

const formSchema = z.object({
  newPassword: z.string({ error: "New password is required" }).min(8),
  oldPassword: z.string({ error: "your current password is required" }).min(8),
});

type FormValues = z.infer<typeof formSchema>;

interface ChangePasswordFormProps {
  onClose?: () => void;
}
function ChangePasswordForm({ onClose }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      newPassword: "",
      oldPassword: "",
    },
    validate: zod4Resolver(formSchema),
  });

  async function handleSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      await changePassword({
        newPassword: data.newPassword,
        oldPassword: data.oldPassword,
      });
      notifications.show({
        message: t("Password changed successfully"),
      });

      onClose();
    } catch (err) {
      notifications.show({
        color: "red",
        message: `Error: ${err.response.data.message}`,
      });
    }
    setIsLoading(false);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <PasswordInput
        data-autofocus
        label={t("Current password")}
        mb="md"
        name="oldPassword"
        placeholder={t("Enter your current password")}
        variant="filled"
        visibilityToggleButtonProps={{
          "aria-hidden": false,
          "aria-label": t("Toggle password visibility"),
          tabIndex: 0,
        }}
        {...form.getInputProps("oldPassword")}
      />

      <PasswordInput
        label={t("New password")}
        mb="md"
        placeholder={t("Enter your new password")}
        variant="filled"
        visibilityToggleButtonProps={{
          "aria-hidden": false,
          "aria-label": t("Toggle password visibility"),
          tabIndex: 0,
        }}
        {...form.getInputProps("newPassword")}
      />

      <Group justify="flex-end" mt="md">
        <Button disabled={isLoading} loading={isLoading} type="submit">
          {t("Change password")}
        </Button>
      </Group>
    </form>
  );
}
