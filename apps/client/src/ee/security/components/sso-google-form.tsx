import { Box, Button, Group, Stack, Switch, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import classes from "@/ee/security/components/sso.module.css";
import { useUpdateSsoProviderMutation } from "@/ee/security/queries/security-query.ts";
import { IAuthProvider } from "@/ee/security/types/security.types.ts";

const ssoSchema = z.object({
  allowSignup: z.boolean(),
  isEnabled: z.boolean(),
  name: z.string().min(1, "Provider name is required"),
});

type SSOFormValues = z.infer<typeof ssoSchema>;

interface SsoFormProps {
  onClose?: () => void;
  provider: IAuthProvider;
}
export function SsoGoogleForm({ provider, onClose }: SsoFormProps) {
  const { t } = useTranslation();
  const updateSsoProviderMutation = useUpdateSsoProviderMutation();

  const form = useForm<SSOFormValues>({
    initialValues: {
      allowSignup: provider.allowSignup,
      isEnabled: provider.isEnabled,
      name: provider.name || "",
    },
    validate: zod4Resolver(ssoSchema),
  });

  const handleSubmit = async (values: SSOFormValues) => {
    const ssoData: Partial<IAuthProvider> = {
      providerId: provider.id,
    };
    if (form.isDirty("name")) {
      ssoData.name = values.name;
    }
    if (form.isDirty("isEnabled")) {
      ssoData.isEnabled = values.isEnabled;
    }
    if (form.isDirty("allowSignup")) {
      ssoData.allowSignup = values.allowSignup;
    }

    await updateSsoProviderMutation.mutateAsync(ssoData);
    form.resetDirty();
    onClose();
  };

  return (
    <Box maw={600} mx="auto">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Display name"
            placeholder="e.g Okta SSO"
            readOnly
            {...form.getInputProps("name")}
          />
          <Group justify="space-between">
            <div>{t("Allow signup")}</div>
            <Switch
              checked={form.values.allowSignup}
              className={classes.switch}
              {...form.getInputProps("allowSignup")}
            />
          </Group>

          <Group justify="space-between">
            <div>{t("Enabled")}</div>
            <Switch
              checked={form.values.isEnabled}
              className={classes.switch}
              {...form.getInputProps("isEnabled")}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button disabled={!form.isDirty()} type="submit">
              {t("Save")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
