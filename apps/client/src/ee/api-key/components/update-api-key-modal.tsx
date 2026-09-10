import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { IApiKey } from "@/ee/api-key";
import { useUpdateApiKeyMutation } from "@/ee/api-key/queries/api-key-query";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});
type FormValues = z.infer<typeof formSchema>;

interface UpdateApiKeyModalProps {
  apiKey: IApiKey | null;
  onClose: () => void;
  opened: boolean;
}

export function UpdateApiKeyModal({
  opened,
  onClose,
  apiKey,
}: UpdateApiKeyModalProps) {
  const { t } = useTranslation();
  const updateApiKeyMutation = useUpdateApiKeyMutation();

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
    },
    validate: zod4Resolver(formSchema),
  });

  useEffect(() => {
    if (opened && apiKey) {
      form.setValues({ name: apiKey.name });
    }
  }, [opened, apiKey]);

  const handleSubmit = async (data: { name?: string }) => {
    const apiKeyData = {
      apiKeyId: apiKey.id,
      name: data.name,
    };

    await updateApiKeyMutation.mutateAsync(apiKeyData);
    onClose();
  };

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      size="md"
      title={t("Update {{credential}}", { credential: t("API key") })}
    >
      <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
        <Stack gap="md">
          <TextInput
            label={t("Name")}
            placeholder={t("Enter a descriptive token name")}
            required
            {...form.getInputProps("name")}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={onClose} variant="default">
              {t("Cancel")}
            </Button>
            <Button loading={updateApiKeyMutation.isPending} type="submit">
              {t("Update")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
