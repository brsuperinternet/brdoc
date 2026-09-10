import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";

export default function ChangeEmail() {
  const { t } = useTranslation();
  const [currentUser] = useAtom(currentUserAtom);
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text size="md">{t("Email")}</Text>
        <Text c="dimmed" size="sm">
          {currentUser?.user.email}
        </Text>
      </div>

      {/*
      <Button onClick={open} variant="default" style={{ whiteSpace: "nowrap" }}>
        {t("Change email")}
      </Button>
      */}

      <Modal
        centered
        closeButtonProps={{ "aria-label": t("Close") }}
        onClose={close}
        opened={opened}
        title={t("Change email")}
      >
        <Text mb="md">
          {t(
            "To change your email, you have to enter your password and new email."
          )}
        </Text>
        <ChangeEmailForm />
      </Modal>
    </Group>
  );
}

const formSchema = z.object({
  email: z.email({ error: "New email is required" }),
  password: z.string({ error: "your current password is required" }).min(8),
});

type FormValues = z.infer<typeof formSchema>;

function ChangeEmailForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: zod4Resolver(formSchema),
  });

  function handleSubmit(data: FormValues) {
    setIsLoading(true);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <PasswordInput
        label={t("Password")}
        mb="md"
        placeholder={t("Enter your password")}
        variant="filled"
        visibilityToggleButtonProps={{
          "aria-hidden": false,
          "aria-label": t("Toggle password visibility"),
          tabIndex: 0,
        }}
        {...form.getInputProps("password")}
      />

      <TextInput
        description={t("Enter your new preferred email")}
        id="email"
        label={t("Email")}
        mb="md"
        placeholder={t("New email")}
        variant="filled"
        {...form.getInputProps("email")}
      />

      <Button disabled={isLoading} loading={isLoading} type="submit">
        {t("Change email")}
      </Button>
    </form>
  );
}
