import { Button, Group, Modal, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { useUpdateScimTokenMutation } from "@/ee/scim/queries/scim-token-query";
import { IScimToken } from "@/ee/scim/types/scim-token.types";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});
type FormValues = z.infer<typeof formSchema>;

interface UpdateScimTokenModalProps {
  onClose: () => void;
  opened: boolean;
  scimToken: IScimToken | null;
}

export function UpdateScimTokenModal({
  opened,
  onClose,
  scimToken,
}: UpdateScimTokenModalProps) {
  const { t } = useTranslation();
  const updateMutation = useUpdateScimTokenMutation();

  const form = useForm<FormValues>({
    initialValues: { name: "" },
    validate: zod4Resolver(formSchema),
  });

  useEffect(() => {
    if (opened && scimToken) {
      form.setValues({ name: scimToken.name });
    }
  }, [opened, scimToken]);

  const handleSubmit = async (data: FormValues) => {
    if (!scimToken) {
      return;
    }
    await updateMutation.mutateAsync({
      name: data.name,
      tokenId: scimToken.id,
    });
    onClose();
  };

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      size="md"
      title={t("Update {{credential}}", { credential: t("SCIM token") })}
    >
      <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
        <Stack gap="md">
          <TextInput
            label={t("Name")}
            placeholder={t("Enter a descriptive name")}
            required
            {...form.getInputProps("name")}
          />

          <Group justify="flex-end" mt="md">
            <Button onClick={onClose} variant="default">
              {t("Cancel")}
            </Button>
            <Button loading={updateMutation.isPending} type="submit">
              {t("Update")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
