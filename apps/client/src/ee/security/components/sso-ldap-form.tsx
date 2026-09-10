import {
  Accordion,
  Box,
  Button,
  Group,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconInfoCircle } from "@tabler/icons-react";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import classes from "@/ee/security/components/sso.module.css";
import { useUpdateSsoProviderMutation } from "@/ee/security/queries/security-query.ts";
import { IAuthProvider } from "@/ee/security/types/security.types.ts";

const ssoSchema = z.object({
  allowSignup: z.boolean(),
  groupSync: z.boolean(),
  isEnabled: z.boolean(),
  ldapBaseDn: z.string().min(1, "Base DN is required"),
  ldapBindDn: z.string().min(1, "Bind DN is required"),
  ldapBindPassword: z.string().min(1, "Bind password is required"),
  ldapTlsCaCert: z.string().optional(),
  ldapTlsEnabled: z.boolean(),
  ldapUrl: z.string().url().startsWith("ldap", "Must be an LDAP URL"),
  ldapUserSearchFilter: z.string().optional(),
  name: z.string().min(1, "Display name is required"),
});

type SSOFormValues = z.infer<typeof ssoSchema>;

interface SsoFormProps {
  onClose?: () => void;
  provider: IAuthProvider;
}

export function SsoLDAPForm({ provider, onClose }: SsoFormProps) {
  const { t } = useTranslation();
  const updateSsoProviderMutation = useUpdateSsoProviderMutation();

  const form = useForm<SSOFormValues>({
    initialValues: {
      allowSignup: provider.allowSignup,
      groupSync: provider.groupSync,
      isEnabled: provider.isEnabled,
      ldapBaseDn: provider.ldapBaseDn || "",
      ldapBindDn: provider.ldapBindDn || "",
      ldapBindPassword: provider.ldapBindPassword || "",
      ldapTlsCaCert: provider.ldapTlsCaCert || "",
      ldapTlsEnabled: provider.ldapTlsEnabled,
      ldapUrl: provider.ldapUrl || "",
      ldapUserSearchFilter:
        provider.ldapUserSearchFilter || "(mail={{username}})",
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
    if (form.isDirty("ldapUrl")) {
      ssoData.ldapUrl = values.ldapUrl;
    }
    if (form.isDirty("ldapBindDn")) {
      ssoData.ldapBindDn = values.ldapBindDn;
    }
    if (form.isDirty("ldapBindPassword")) {
      ssoData.ldapBindPassword = values.ldapBindPassword;
    }
    if (form.isDirty("ldapBaseDn")) {
      ssoData.ldapBaseDn = values.ldapBaseDn;
    }
    if (form.isDirty("ldapUserSearchFilter")) {
      ssoData.ldapUserSearchFilter = values.ldapUserSearchFilter;
    }
    if (form.isDirty("ldapTlsEnabled")) {
      ssoData.ldapTlsEnabled = values.ldapTlsEnabled;
    }
    if (form.isDirty("ldapTlsCaCert")) {
      ssoData.ldapTlsCaCert = values.ldapTlsCaCert;
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
            placeholder="e.g Company LDAP"
            {...form.getInputProps("name")}
          />

          <TextInput
            description="URL of your LDAP server"
            label="LDAP Server URL"
            placeholder="ldap://ldap.example.com:389 or ldaps://ldap.example.com:636"
            {...form.getInputProps("ldapUrl")}
          />

          <TextInput
            description="Distinguished Name of the service account for searching"
            label="Bind DN"
            placeholder="cn=admin,dc=example,dc=com"
            {...form.getInputProps("ldapBindDn")}
          />

          <TextInput
            description="Password for the service account"
            label="Bind Password"
            placeholder="••••••••"
            type="password"
            {...form.getInputProps("ldapBindPassword")}
          />

          <TextInput
            description="Base DN where user searches will start"
            label="Base DN"
            placeholder="ou=users,dc=example,dc=com"
            {...form.getInputProps("ldapBaseDn")}
          />

          <TextInput
            description="LDAP filter to find users. Use {{username}} as placeholder"
            label="User Search Filter"
            placeholder="(mail={{username}})"
            {...form.getInputProps("ldapUserSearchFilter")}
          />

          <Accordion variant="separated">
            <Accordion.Item value="advanced">
              <Accordion.Control icon={<IconInfoCircle size={20} />}>
                {t("Advanced Settings")}
              </Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <Group justify="space-between">
                    <div>
                      <Text size="sm">{t("Enable TLS/SSL")}</Text>
                      <Text c="dimmed" size="xs">
                        Use secure connection to LDAP server
                      </Text>
                    </div>
                    <Switch
                      checked={form.values.ldapTlsEnabled}
                      className={classes.switch}
                      {...form.getInputProps("ldapTlsEnabled")}
                    />
                  </Group>

                  {form.values.ldapTlsEnabled && (
                    <Textarea
                      description="PEM-encoded CA certificate for TLS verification (optional)"
                      label="CA Certificate"
                      minRows={4}
                      placeholder="-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----"
                      {...form.getInputProps("ldapTlsCaCert")}
                    />
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

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
