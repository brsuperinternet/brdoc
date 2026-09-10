import {
  Anchor,
  Button,
  Center,
  Container,
  Paper,
  PinInput,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconDeviceMobile, IconLock } from "@tabler/icons-react";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { z } from "zod/v4";
import { verifyMfa } from "@/ee/mfa";
import { AuthLayout } from "@/features/auth/components/auth-layout.tsx";
import { getPostLoginRedirect } from "@/lib/app-route";
import { MfaBackupCodeInput } from "./mfa-backup-code-input";
import classes from "./mfa-challenge.module.css";

const formSchema = z.object({
  code: z
    .string()
    .refine(
      (val) => (val.length === 6 && /^\d{6}$/.test(val)) || val.length === 8,
      {
        message: "Enter a 6-digit code or 8-character backup code",
      }
    ),
});

type MfaChallengeFormValues = z.infer<typeof formSchema>;

export function MfaChallenge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const form = useForm<MfaChallengeFormValues>({
    initialValues: {
      code: "",
    },
    validate: zod4Resolver(formSchema),
  });

  const handleSubmit = async (values: MfaChallengeFormValues) => {
    setIsLoading(true);
    try {
      await verifyMfa(values.code);
      navigate(getPostLoginRedirect());
    } catch (error: any) {
      setIsLoading(false);
      notifications.show({
        color: "red",
        message:
          error.response?.data?.message || t("Invalid verification code"),
      });
      form.setFieldValue("code", "");
    }
  };

  return (
    <AuthLayout>
      <Container className={classes.container} size={420}>
        <Paper className={classes.paper} p={40} radius="lg">
          <Stack align="center" gap="xl">
            <Center>
              <ThemeIcon color="blue" radius="xl" size={80} variant="light">
                <IconDeviceMobile size={40} stroke={1.5} />
              </ThemeIcon>
            </Center>

            <Stack align="center" gap="xs">
              <Title fw={600} order={2} ta="center">
                {t("Two-factor authentication")}
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                {useBackupCode
                  ? t("Enter one of your backup codes")
                  : t("Enter the 6-digit code found in your authenticator app")}
              </Text>
            </Stack>

            {useBackupCode ? (
              <MfaBackupCodeInput
                error={form.errors.code?.toString()}
                isLoading={isLoading}
                onCancel={() => {
                  setUseBackupCode(false);
                  form.setFieldValue("code", "");
                  form.clearErrors();
                }}
                onChange={(value) => form.setFieldValue("code", value)}
                onSubmit={() => handleSubmit(form.values)}
                value={form.values.code}
              />
            ) : (
              <form
                onSubmit={form.onSubmit(handleSubmit)}
                style={{ width: "100%" }}
              >
                <Stack gap="lg">
                  <Center>
                    <PinInput
                      autoFocus
                      data-autofocus
                      length={6}
                      oneTimeCode
                      type="number"
                      {...form.getInputProps("code")}
                      error={!!form.errors.code}
                      styles={{
                        input: {
                          fontSize: "1.2rem",
                          textAlign: "center",
                        },
                      }}
                    />
                  </Center>
                  {form.errors.code && (
                    <Text c="red" size="sm" ta="center">
                      {form.errors.code}
                    </Text>
                  )}

                  <Button
                    fullWidth
                    leftSection={<IconLock size={18} />}
                    loading={isLoading}
                    size="md"
                    type="submit"
                  >
                    {t("Verify")}
                  </Button>

                  <Anchor
                    c="dimmed"
                    component="button"
                    onClick={() => {
                      setUseBackupCode(true);
                      form.setFieldValue("code", "");
                      form.clearErrors();
                    }}
                    size="sm"
                    type="button"
                  >
                    {t("Use backup code")}
                  </Anchor>
                </Stack>
              </form>
            )}
          </Stack>
        </Paper>
      </Container>
    </AuthLayout>
  );
}
