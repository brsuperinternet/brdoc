import {
  Alert,
  Button,
  Center,
  Container,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconShieldCheck } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MfaSetupModal, useMfaPageProtection } from "@/ee/mfa";
import classes from "@/features/auth/components/auth.module.css";
import APP_ROUTE from "@/lib/app-route";

export function MfaSetupRequiredPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const { isValid } = useMfaPageProtection();

  const handleSetupComplete = async () => {
    setSetupModalOpen(false);

    notifications.show({
      message: t(
        "Two-factor authentication has been set up. Please log in again."
      ),
      title: t("Success"),
    });

    navigate(APP_ROUTE.AUTH.LOGIN);
  };

  const handleLogout = () => {
    navigate(APP_ROUTE.AUTH.LOGIN);
  };

  if (!isValid) {
    return null;
  }

  return (
    <Container className={classes.container} size={480}>
      <Paper p={40} radius="lg">
        <Stack align="center" gap="xl">
          <Center>
            <ThemeIcon color="blue" radius="xl" size={80} variant="light">
              <IconShieldCheck size={40} stroke={1.5} />
            </ThemeIcon>
          </Center>

          <Stack align="center" gap="xs">
            <Title fw={600} order={2} ta="center">
              {t("Two-factor authentication required")}
            </Title>
            <Text c="dimmed" size="md" ta="center">
              {t(
                "Your workspace requires two-factor authentication for all users"
              )}
            </Text>
          </Stack>

          <Alert
            color="blue"
            icon={<IconAlertCircle size={20} />}
            variant="light"
            w="100%"
          >
            <Text size="sm">
              {t(
                "To continue accessing your workspace, you must set up two-factor authentication. This adds an extra layer of security to your account."
              )}
            </Text>
          </Alert>

          <Stack gap="sm" w="100%">
            <Button
              fullWidth
              leftSection={<IconShieldCheck size={18} />}
              onClick={() => setSetupModalOpen(true)}
              size="md"
            >
              {t("Set up two-factor authentication")}
            </Button>

            <Button
              color="gray"
              fullWidth
              onClick={handleLogout}
              variant="subtle"
            >
              {t("Cancel and logout")}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <MfaSetupModal
        isRequired={true}
        onClose={() => setSetupModalOpen(false)}
        onComplete={handleSetupComplete}
        opened={setupModalOpen}
      />
    </Container>
  );
}
