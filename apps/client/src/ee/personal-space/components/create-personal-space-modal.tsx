import { Button, Divider, Group, Modal, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAtomValue } from "jotai";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { z } from "zod/v4";
import { useCreatePersonalSpaceMutation } from "@/ee/personal-space/queries/personal-space-query";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";
import { getSpaceUrl } from "@/lib/config.ts";

const formSchema = z.object({
  name: z.string().trim().min(2).max(100),
});
type FormValues = z.infer<typeof formSchema>;

type Props = {
  opened: boolean;
  onClose: () => void;
};

export default function CreatePersonalSpaceModal({ opened, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useAtomValue(currentUserAtom);
  const createMutation = useCreatePersonalSpaceMutation();

  const firstName =
    (currentUser?.user?.name ?? "").trim().split(/\s+/)[0] || "";

  const form = useForm<FormValues>({
    initialValues: {
      name: firstName ? t("{{name}}'s space", { name: firstName }) : "",
    },
    validate: zod4Resolver(formSchema),
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      const createdSpace = await createMutation.mutateAsync({
        name: values.name,
      });
      onClose();
      navigate(getSpaceUrl(createdSpace.slug));
    } catch (err) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message,
      });
    }
  };

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      title={t("Create personal space")}
    >
      <Divider mb="md" size="xs" />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          data-autofocus
          errorProps={{ role: "alert" }}
          label={t("Space name")}
          variant="filled"
          withAsterisk
          {...form.getInputProps("name")}
        />
        <Group justify="flex-end" mt="md">
          <Button loading={createMutation.isPending} type="submit">
            {t("Create")}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
