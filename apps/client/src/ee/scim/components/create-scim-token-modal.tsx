import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { useCreateScimTokenMutation } from "@/ee/scim/queries/scim-token-query";
import { IScimToken } from "@/ee/scim/types/scim-token.types";

interface CreateScimTokenModalProps {
  onClose: () => void;
  onSuccess: (response: IScimToken) => void;
  opened: boolean;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});
type FormValues = z.infer<typeof formSchema>;

export function CreateScimTokenModal({
  opened,
  onClose,
  onSuccess,
}: CreateScimTokenModalProps) {
  const { t } = useTranslation();
  const createMutation = useCreateScimTokenMutation();

  const form = useForm<FormValues>({
    initialValues: { name: "" },
    validate: zod4Resolver(formSchema),
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      const created = await createMutation.mutateAsync({ name: data.name });
      onSuccess(created);
      form.reset();
      onClose();
    } catch (err) {
      //
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={handleClose}
      opened={opened}
      size="md"
      title={t("Create {{credential}}", { credential: t("SCIM token") })}
    >
      <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
        <Stack gap="md">
          <TextInput
            data-autofocus
            label={t("Name")}
            placeholder={t("Enter a descriptive name")}
            required
            {...form.getInputProps("name")}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={handleClose} variant="default">
              {t("Cancel")}
            </Button>
            <Button loading={createMutation.isPending} type="submit">
              {t("Create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
