import { Button, Group, Modal, Text, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { RESET } from "jotai/utils";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { getHostnameUrl } from "@/ee/utils.ts";
import {
  currentUserAtom,
  workspaceAtom,
} from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";
import { IWorkspace } from "@/features/workspace/types/workspace.types.ts";
import useUserRole from "@/hooks/use-user-role.tsx";
import { getSubdomainHost } from "@/lib/config.ts";

export default function ManageHostname() {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const [workspace] = useAtom(workspaceAtom);
  const { isAdmin } = useUserRole();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Hostname")}</Text>
        <Text c="dimmed" fw={500} size="sm">
          {workspace?.hostname}.{getSubdomainHost()}
        </Text>
      </div>

      {isAdmin && (
        <Button onClick={open} variant="default">
          {t("Change hostname")}
        </Button>
      )}

      <Modal
        centered
        onClose={close}
        opened={opened}
        title={t("Change hostname")}
      >
        <ChangeHostnameForm onClose={close} />
      </Modal>
    </Group>
  );
}

const formSchema = z.object({
  hostname: z.string().min(4),
});

type FormValues = z.infer<typeof formSchema>;

interface ChangeHostnameFormProps {
  onClose?: () => void;
}
function ChangeHostnameForm({ onClose }: ChangeHostnameFormProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);

  const form = useForm<FormValues>({
    initialValues: {
      hostname: currentUser?.workspace?.hostname,
    },
    validate: zod4Resolver(formSchema),
  });

  async function handleSubmit(data: Partial<IWorkspace>) {
    setIsLoading(true);

    if (data.hostname === currentUser?.workspace?.hostname) {
      onClose();
      return;
    }

    try {
      await updateWorkspace({
        hostname: data.hostname,
      });
      setCurrentUser(RESET);
      window.location.href = getHostnameUrl(data.hostname.toLowerCase());
    } catch (err) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message,
      });
    }
    setIsLoading(false);
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label="Hostname"
        placeholder="e.g my-team"
        rightSection={<Text fw={500}>.{getSubdomainHost()}</Text>}
        rightSectionWidth={150}
        type="text"
        variant="filled"
        width={200}
        withErrorStyles={false}
        {...form.getInputProps("hostname")}
      />

      <Group justify="flex-end" mt="md">
        <Button disabled={isLoading} loading={isLoading} type="submit">
          {t("Change hostname")}
        </Button>
      </Group>
    </form>
  );
}
