import { Button, TagsInput, Text } from "@mantine/core";
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

const formSchema = z.object({
  emailDomains: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;
export default function AllowedDomains() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [, setDomains] = useState<string[]>([]);

  const form = useForm<FormValues>({
    initialValues: {
      emailDomains: workspace?.emailDomains || [],
    },
    validate: zod4Resolver(formSchema),
  });

  async function handleSubmit(data: Partial<IWorkspace>) {
    setIsLoading(true);
    try {
      const updatedWorkspace = await updateWorkspace({
        emailDomains: data.emailDomains,
      });
      setWorkspace(updatedWorkspace);

      notifications.show({
        message: t("Updated successfully"),
      });
    } catch (err) {
      console.log(err);
      notifications.show({
        color: "red",
        message: err.response.data.message,
      });
    }

    form.resetDirty();

    setIsLoading(false);
  }

  return (
    <>
      <div>
        <Text size="md">{t("Allowed email domains")}</Text>
        <Text c="dimmed" size="sm">
          {t(
            "Only users with email addresses from these domains can signup via SSO."
          )}
        </Text>
      </div>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TagsInput
          description={t(
            "Enter valid domain names separated by comma or space"
          )}
          maxDropdownHeight={0}
          maxTags={20}
          mt="sm"
          onChange={setDomains}
          placeholder={t("e.g acme.com")}
          splitChars={[",", " "]}
          variant="filled"
          {...form.getInputProps("emailDomains")}
        />

        <Button
          disabled={!form.isDirty()}
          loading={isLoading}
          mt="sm"
          type="submit"
        >
          {t("Save")}
        </Button>
      </form>
    </>
  );
}
