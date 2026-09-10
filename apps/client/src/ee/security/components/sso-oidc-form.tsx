import { Box, Button, Group, Stack, Switch, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import CopyTextButton from "@/components/common/copy.tsx";
import classes from "@/ee/security/components/sso.module.css";
import { useUpdateSsoProviderMutation } from "@/ee/security/queries/security-query.ts";
import { buildCallbackUrl } from "@/ee/security/sso.utils.ts";
import { IAuthProvider } from "@/ee/security/types/security.types.ts";

const ssoSchema = z.object({
  allowSignup: z.boolean(),
  groupSync: z.boolean(),
  isEnabled: z.boolean(),
  name: z.string().min(1, "Display name is required"),
  oidcClientId: z.string().min(1, "Client id is required"),
  oidcClientSecret: z.string().min(1, "Client secret is required"),
  oidcIssuer: z.string().url(),
});

type SSOFormValues = z.infer<typeof ssoSchema>;

interface SsoFormProps {
  onClose?: () => void;
  provider: IAuthProvider;
}
export function SsoOIDCForm({ provider, onClose }: SsoFormProps) {
  const { t } = useTranslation();
  const updateSsoProviderMutation = useUpdateSsoProviderMutation();

  const form = useForm<SSOFormValues>({
    initialValues: {
      allowSignup: provider.allowSignup,
      groupSync: provider.groupSync,
      isEnabled: provider.isEnabled,
      name: provider.name || "",
      oidcClientId: provider.oidcClientId || "",
      oidcClientSecret: provider.oidcClientSecret || "",
      oidcIssuer: provider.oidcIssuer || "",
    },
    validate: zod4Resolver(ssoSchema),
  });

  const callbackUrl = buildCallbackUrl({
    providerId: provider.id,
    type: provider.type,
  });

  const handleSubmit = async (values: SSOFormValues) => {
    const ssoData: Partial<IAuthProvider> = {
      providerId: provider.id,
    };
    if (form.isDirty("name")) {
      ssoData.name = values.name;
    }
    if (form.isDirty("oidcIssuer")) {
      ssoData.oidcIssuer = values.oidcIssuer;
    }
    if (form.isDirty("oidcClientId")) {
      ssoData.oidcClientId = values.oidcClientId;
    }
    if (form.isDirty("oidcClientSecret")) {
      ssoData.oidcClientSecret = values.oidcClientSecret;
    }
    if (form.isDirty("isEnabled")) {
      ssoData.isEnabled = values.isEnabled;
    }
    if (form.isDirty("allowSignup")) {
      ssoData.allowSignup = values.allowSignup;
    }
    if (form.isDirty("groupSync")) {
      ssoData.groupSync = values.groupSync;
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
            data-autofocus
            label={t("Display name")}
            placeholder="e.g Google SSO"
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Callback URL"
            pointer
            readOnly
            rightSection={<CopyTextButton text={callbackUrl} />}
            value={callbackUrl}
            variant="filled"
          />
          <TextInput
            description="Enter your OIDC issuer URL"
            label="Issuer URL"
            placeholder="e.g https://accounts.google.com/"
            {...form.getInputProps("oidcIssuer")}
          />
          <TextInput
            description="Enter your OIDC ClientId"
            label="Client ID"
            placeholder="e.g 292085223830.apps.googleusercontent.com"
            {...form.getInputProps("oidcClientId")}
          />
          <TextInput
            description="Enter your OIDC Client Secret"
            label="Client Secret"
            placeholder="e.g OCSPX-zVCkotEPGRnJA1XKUrbgjlf7PQQ-"
            {...form.getInputProps("oidcClientSecret")}
          />

          <Group justify="space-between">
            <div>{t("Group sync")}</div>
            <Switch
              checked={form.values.groupSync}
              className={classes.switch}
              {...form.getInputProps("groupSync")}
            />
          </Group>

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
