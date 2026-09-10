import { Box, Button, Group, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { useUpdateSpaceMutation } from "@/features/space/queries/space-query.ts";
import { ISpace } from "@/features/space/types/space.types.ts";

const formSchema = z.object({
  description: z.string().max(500),
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
      "Space slug must start with a letter or number and may contain hyphens and underscores"
    ),
});

type FormValues = z.infer<typeof formSchema>;
interface EditSpaceFormProps {
  readOnly?: boolean;
  space: ISpace;
}
export function EditSpaceForm({ space, readOnly }: EditSpaceFormProps) {
  const { t } = useTranslation();
  const updateSpaceMutation = useUpdateSpaceMutation();

  const form = useForm<FormValues>({
    initialValues: {
      description: space?.description || "",
      name: space?.name,
      slug: space.slug,
    },
    validate: zod4Resolver(formSchema),
  });

  const handleSubmit = async (values: {
    name?: string;
    description?: string;
    slug?: string;
  }) => {
    const spaceData: Partial<ISpace> = {
      spaceId: space.id,
    };
    if (form.isDirty("name")) {
      spaceData.name = values.name;
    }
    if (form.isDirty("description")) {
      spaceData.description = values.description;
    }

    if (form.isDirty("slug")) {
      spaceData.slug = values.slug;
    }

    await updateSpaceMutation.mutateAsync(spaceData);
    form.resetDirty();
  };

  return (
    <>
      <Box>
        <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
          <Stack>
            <TextInput
              id="name"
              label={t("Name")}
              placeholder={t("e.g Sales")}
              readOnly={readOnly}
              variant="filled"
              {...form.getInputProps("name")}
            />

            <TextInput
              id="slug"
              label={t("Slug")}
              readOnly={readOnly}
              variant="filled"
              {...form.getInputProps("slug")}
            />

            <Textarea
              autosize
              id="description"
              label={t("Description")}
              maxRows={3}
              minRows={1}
              placeholder={t("e.g Space for sales team to collaborate")}
              readOnly={readOnly}
              variant="filled"
              {...form.getInputProps("description")}
            />
          </Stack>

          {!readOnly && (
            <Group justify="flex-end" mt="md">
              <Button disabled={!form.isDirty()} type="submit">
                {t("Save")}
              </Button>
            </Group>
          )}
        </form>
      </Box>
    </>
  );
}
