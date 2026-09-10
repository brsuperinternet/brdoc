import {
  Box,
  Button,
  Group,
  Stack,
  Switch,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import CopyTextButton from "@/components/common/copy.tsx";
import classes from "@/ee/security/components/sso.module.css";
import { useUpdateSsoProviderMutation } from "@/ee/security/queries/security-query.ts";
import {
  buildCallbackUrl,
  buildSamlEntityId,
} from "@/ee/security/sso.utils.ts";
import { IAuthProvider } from "@/ee/security/types/security.types.ts";

const ssoSchema = z.object({
  allowSignup: z.boolean(),
  groupSync: z.boolean(),
  isEnabled: z.boolean(),
  name: z.string().min(1, "Display name is required"),
  samlCertificate: z.string().min(1, "SAML Idp Certificate is required"),
  samlUrl: z.string().url(),
});

type SSOFormValues = z.infer<typeof ssoSchema>;

interface SsoFormProps {
  onClose?: () => void;
  provider: IAuthProvider;
}
export function SsoSamlForm({ provider, onClose }: SsoFormProps) {
  const { t } = useTranslation();
  const updateSsoProviderMutation = useUpdateSsoProviderMutation();

  const form = useForm<SSOFormValues>({
    initialValues: {
      allowSignup: provider.allowSignup,
      groupSync: provider.groupSync,
      isEnabled: provider.isEnabled,
      name: provider.name || "",
      samlCertificate: provider.samlCertificate || "",
      samlUrl: provider.samlUrl || "",
    },
    validate: zod4Resolver(ssoSchema),
  });

  const callbackUrl = buildCallbackUrl({
    providerId: provider.id,
    type: provider.type,
  });

  const samlEntityId = buildSamlEntityId(provider.id);

  const handleSubmit = async (values: SSOFormValues) => {
    const ssoData: Partial<IAuthProvider> = {
      providerId: provider.id,
    };
    if (form.isDirty("name")) {
      ssoData.name = values.name;
    }
    if (form.isDirty("samlUrl")) {
      ssoData.samlUrl = values.samlUrl;
    }
    if (form.isDirty("samlCertificate")) {
      ssoData.samlCertificate = values.samlCertificate;
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
            placeholder="e.g Azure Entra"
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Entity ID"
            pointer
            readOnly
            rightSection={<CopyTextButton text={samlEntityId} />}
            value={buildSamlEntityId(provider.id)}
            variant="filled"
          />
          <TextInput
            label="Callback URL (ACS)"
            pointer
            readOnly
            rightSection={<CopyTextButton text={callbackUrl} />}
            value={callbackUrl}
            variant="filled"
          />
          <TextInput
            description="Enter your IDP login URL"
            label="IDP Login URL"
            placeholder="e.g https://login.microsoftonline.com/7d6246d1-273b-4981-ad1e-e7bb27b86569/saml2"
            {...form.getInputProps("samlUrl")}
          />
          <Textarea
            autosize
            description="Enter your IDP certificate"
            label="IDP Certificate"
            maxRows={5}
            minRows={3}
            placeholder="-----BEGIN CERTIFICATE-----"
            {...form.getInputProps("samlCertificate")}
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
