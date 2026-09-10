import { Box, Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { z } from "zod/v4";
import { MultiUserSelect } from "@/features/group/components/multi-user-select.tsx";
import { useCreateGroupMutation } from "@/features/group/queries/group-query.ts";

const formSchema = z.object({
  description: z.string().max(500),
  name: z.string().trim().min(2).max(100),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateGroupForm() {
  const { t } = useTranslation();
  const createGroupMutation = useCreateGroupMutation();
  const [userIds, setUserIds] = useState<string[]>([]);
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    initialValues: {
      description: "",
      name: "",
    },
    validate: zod4Resolver(formSchema),
  });

  const handleMultiSelectChange = (value: string[]) => {
    setUserIds(value);
  };

  const handleSubmit = async (data: {
    name?: string;
    description?: string;
  }) => {
    const groupData = {
      description: data.description,
      name: data.name,
      userIds,
    };

    const createdGroup = await createGroupMutation.mutateAsync(groupData);
    navigate(`/settings/groups/${createdGroup.id}`);
  };

  return (
    <>
      <Box maw="500" mx="auto">
        <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
          <Stack>
            <TextInput
              data-autofocus
              id="name"
              label={t("Group name")}
              placeholder={t("e.g Developers")}
              variant="filled"
              withAsterisk
              {...form.getInputProps("name")}
            />

            <Textarea
              autosize
              id="description"
              label={t("Group description")}
              maxRows={8}
              minRows={2}
              placeholder={t("e.g Group for developers")}
              variant="filled"
              {...form.getInputProps("description")}
            />

            <MultiUserSelect
              label={t("Add group members")}
              onChange={handleMultiSelectChange}
            />
          </Stack>

          <Group justify="flex-end" mt="md">
            <Button type="submit">{t("Create")}</Button>
          </Group>
        </form>
      </Box>
    </>
  );
}
