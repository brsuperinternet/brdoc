import { Box, Button, Container, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  resendVerificationEmail,
  verifyEmail,
} from "@/ee/cloud/service/cloud-service.ts";
import { AuthLayout } from "@/features/auth/components/auth-layout.tsx";
import APP_ROUTE from "@/lib/app-route.ts";
import classes from "../../features/auth/components/auth.module.css";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const rawEmail = searchParams.get("email");
  const email =
    rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : null;
  const sig = searchParams.get("sig");
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  async function handleVerify(verifyToken: string) {
    try {
      await verifyEmail({ token: verifyToken });
      navigate(APP_ROUTE.HOME);
    } catch (err) {
      notifications.show({
        color: "red",
        message: t("Verification failed. The link may have expired."),
      });
      navigate(APP_ROUTE.AUTH.LOGIN);
    }
  }

  async function handleResend() {
    if (!(email && sig)) {
      return;
    }
    setIsResending(true);

    try {
      await resendVerificationEmail({ email, sig });
      setResent(true);
    } catch {
      notifications.show({
        color: "red",
        message: t("Failed to resend verification email. Please try again."),
      });
    }

    setIsResending(false);
  }

  if (token) {
    return (
      <AuthLayout>
        <Container className={classes.container} size={420}>
          <Box className={classes.containerBox} p="xl">
            <Title fw={500} mb="md" order={2} ta="center">
              {t("Verifying your email")}
            </Title>
            <Text c="dimmed" ta="center">
              {t("Please wait...")}
            </Text>
          </Box>
        </Container>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Container className={classes.container} size={420}>
        <Box className={classes.containerBox} p="xl">
          <Title fw={500} mb="md" order={2} ta="center">
            {t("Check your email")}
          </Title>
          <Text c="dimmed" mb="md" ta="center">
            {email
              ? t("We sent a verification link to {{email}}.", { email })
              : t("We sent a verification link to your email.")}
          </Text>
          <Text c="dimmed" mb="lg" size="sm" ta="center">
            {t(
              "Click the link to verify your email and access your workspace."
            )}
          </Text>
          {email && sig && !resent && (
            <Button
              fullWidth
              loading={isResending}
              onClick={handleResend}
              variant="light"
            >
              {t("Resend verification email")}
            </Button>
          )}
          {resent && (
            <Text c="dimmed" size="sm" ta="center">
              {t("Verification email sent. Please check your inbox.")}
            </Text>
          )}
        </Box>
      </Container>
    </AuthLayout>
  );
}
