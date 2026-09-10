import { Box, Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { z } from "zod/v4";
import {
  useGroupQuery,
  useUpdateGroupMutation,
} from "@/features/group/queries/group-query.ts";
import { IGroup } from "@/features/group/types/group.types.ts";

const formSchema = z.object({
  description: z.string().max(500),
  name: z.string().min(2).max(100),
});

type FormValues = z.infer<typeof formSchema>;
interface EditGroupFormProps {
  group?: IGroup;
  onClose?: () => void;
}
export function EditGroupForm({
  onClose,
  group: groupProp,
}: EditGroupFormProps) {
  const { t } = useTranslation();
  const updateGroupMutation = useUpdateGroupMutation();
  const { isSuccess } = updateGroupMutation;
  const { groupId: routeGroupId } = useParams();
  const groupId = groupProp?.id ?? routeGroupId;
  const { data: queriedGroup } = useGroupQuery(groupProp ? undefined : groupId);
  const group = groupProp ?? queriedGroup;

  useEffect(() => {
    if (isSuccess && onClose) {
      onClose();
    }
  }, [isSuccess]);

  const form = useForm<FormValues>({
    initialValues: {
      description: group?.description,
      name: group?.name,
    },
    validate: zod4Resolver(formSchema),
  });

  const handleSubmit = async (data: {
    name?: string;
    description?: string;
  }) => {
    const groupData = {
      description: data.description,
      groupId,
      name: data.name,
    };

    await updateGroupMutation.mutateAsync(groupData);
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
          </Stack>

          <Group justify="flex-end" mt="md">
            <Button type="submit">{t("Save")}</Button>
          </Group>
        </form>
      </Box>
    </>
  );
}
