import { Box, Button, Container, Text, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import useAuth from "@/features/auth/hooks/use-auth";
import { useRedirectIfAuthenticated } from "@/features/auth/hooks/use-redirect-if-authenticated.ts";
import classes from "./auth.module.css";
import { AuthLayout } from "./auth-layout.tsx";

const formSchema = z.object({
  email: z.email().min(1, { message: "Email is required" }),
});
type FormValues = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { forgotPassword, isLoading } = useAuth();
  const [isTokenSent, setIsTokenSent] = useState<boolean>(false);
  useRedirectIfAuthenticated();

  const form = useForm<FormValues>({
    initialValues: {
      email: "",
    },
    validate: zod4Resolver(formSchema),
  });

  async function onSubmit(data: FormValues) {
    if (await forgotPassword(data)) {
      setIsTokenSent(true);
    }
  }

  return (
    <AuthLayout>
      <Container className={classes.container} size={420}>
        <Box className={classes.containerBox} p="xl">
          <Title fw={500} mb="md" order={2} ta="center">
            {t("Forgot password")}
          </Title>

          <form onSubmit={form.onSubmit(onSubmit)}>
            {!isTokenSent && (
              <TextInput
                id="email"
                label="Email"
                placeholder="email@example.com"
                type="email"
                variant="filled"
                {...form.getInputProps("email")}
              />
            )}

            {isTokenSent && (
              <Text>
                {t(
                  "A password reset link has been sent to your email. Please check your inbox."
                )}
              </Text>
            )}

            {!isTokenSent && (
              <Button fullWidth loading={isLoading} mt="xl" type="submit">
                {t("Send reset link")}
              </Button>
            )}
          </form>
        </Box>
      </Container>
    </AuthLayout>
  );
}
