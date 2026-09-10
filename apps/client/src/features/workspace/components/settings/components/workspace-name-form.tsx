import { Button, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";
import { IWorkspace } from "@/features/workspace/types/workspace.types.ts";
import useUserRole from "@/hooks/use-user-role.tsx";

const formSchema = z.object({
  name: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

export default function WorkspaceNameForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const { isAdmin } = useUserRole();

  const form = useForm<FormValues>({
    initialValues: {
      name: workspace?.name,
    },
    validate: zod4Resolver(formSchema),
  });

  async function handleSubmit(data: Partial<IWorkspace>) {
    setIsLoading(true);

    try {
      const updatedWorkspace = await updateWorkspace({ name: data.name });
      setWorkspace(updatedWorkspace);
      notifications.show({ message: t("Updated successfully") });
    } catch (err) {
      console.log(err);
      notifications.show({
        color: "red",
        message: t("Failed to update data"),
      });
    }
    setIsLoading(false);
    form.resetDirty();
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        id="name"
        label={t("Name")}
        placeholder={t("e.g ACME")}
        readOnly={!isAdmin}
        variant="filled"
        {...form.getInputProps("name")}
      />

      {isAdmin && (
        <Button
          disabled={isLoading || !form.isDirty()}
          loading={isLoading}
          mt="sm"
          type="submit"
        >
          {t("Save")}
        </Button>
      )}
    </form>
  );
}
