import { Alert, Container, Paper, Stack, Text, Title } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MfaSetupModal } from "@/ee/mfa";
import { AuthLayout } from "@/features/auth/components/auth-layout.tsx";
import { getPostLoginRedirect } from "@/lib/app-route.ts";

export default function MfaSetupRequired() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSetupComplete = () => {
    navigate(getPostLoginRedirect());
  };

  return (
    <AuthLayout>
      <Container py="xl" size="sm">
        <Paper p="xl" radius="md" shadow="sm" withBorder>
          <Stack>
            <Title order={2} ta="center">
              {t("Two-factor authentication required")}
            </Title>

            <Alert color="yellow" icon={<IconAlertCircle size="1rem" />}>
              <Text size="sm">
                {t(
                  "Your workspace requires two-factor authentication. Please set it up to continue."
                )}
              </Text>
            </Alert>

            <Text c="dimmed" size="sm" ta="center">
              {t(
                "This adds an extra layer of security to your account by requiring a verification code from your authenticator app."
              )}
            </Text>

            <MfaSetupModal
              isRequired={true}
              onComplete={handleSetupComplete}
              opened={true}
            />
          </Stack>
        </Paper>
      </Container>
    </AuthLayout>
  );
}
