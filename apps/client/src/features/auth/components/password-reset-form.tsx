import { Box, Button, Container, PasswordInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import useAuth from "@/features/auth/hooks/use-auth";
import { useRedirectIfAuthenticated } from "@/features/auth/hooks/use-redirect-if-authenticated.ts";
import classes from "./auth.module.css";
import { AuthLayout } from "./auth-layout.tsx";

const formSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: "Password must contain at least 8 characters" }),
});
type FormValues = z.infer<typeof formSchema>;

interface PasswordResetFormProps {
  resetToken?: string;
}

export function PasswordResetForm({ resetToken }: PasswordResetFormProps) {
  const { t } = useTranslation();
  const { passwordReset, isLoading } = useAuth();
  useRedirectIfAuthenticated();

  const form = useForm<FormValues>({
    initialValues: {
      newPassword: "",
    },
    validate: zod4Resolver(formSchema),
  });

  async function onSubmit(data: FormValues) {
    await passwordReset({
      newPassword: data.newPassword,
      token: resetToken,
    });
  }

  return (
    <AuthLayout>
      <Container className={classes.container} size={420}>
        <Box className={classes.containerBox} p="xl">
          <Title fw={500} mb="md" order={2} ta="center">
            {t("Password reset")}
          </Title>

          <form onSubmit={form.onSubmit(onSubmit)}>
            <PasswordInput
              label={t("New password")}
              mt="md"
              placeholder={t("Your new password")}
              variant="filled"
              visibilityToggleButtonProps={{
                "aria-hidden": false,
                "aria-label": t("Toggle password visibility"),
                tabIndex: 0,
              }}
              {...form.getInputProps("newPassword")}
            />

            <Button fullWidth loading={isLoading} mt="xl" type="submit">
              {t("Set password")}
            </Button>
          </form>
        </Box>
      </Container>
    </AuthLayout>
  );
}
