import {
  Anchor,
  Box,
  Button,
  Container,
  Group,
  PasswordInput,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod/v4";
import { Error404 } from "@/components/ui/error-404.tsx";

import useAuth from "@/features/auth/hooks/use-auth";
import { useRedirectIfAuthenticated } from "@/features/auth/hooks/use-redirect-if-authenticated.ts";
import { useWorkspacePublicDataQuery } from "@/features/workspace/queries/workspace-query.ts";
import APP_ROUTE from "@/lib/app-route.ts";
import classes from "./auth.module.css";
import { AuthLayout } from "./auth-layout.tsx";

const formSchema = z.object({
  email: z.email().min(1, { message: "email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});
type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const { t } = useTranslation();
  const { signIn, isLoading } = useAuth();
  useRedirectIfAuthenticated();
  const {
    data,
    isLoading: isDataLoading,
    isError,
    error,
  } = useWorkspacePublicDataQuery();

  const form = useForm<FormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: zod4Resolver(formSchema),
  });

  async function onSubmit(data: FormValues) {
    await signIn(data);
  }

  function handleValidationFailure(errors: Record<string, unknown>) {
    const firstInvalidId = Object.keys(errors)[0];
    if (firstInvalidId) {
      document.getElementById(firstInvalidId)?.focus();
    }
  }

  if (isDataLoading) {
    return null;
  }

  if (isError && error?.["response"]?.status === 404) {
    return <Error404 />;
  }

  return (
    <AuthLayout>
      <Container className={classes.container} size={420}>
        <Box className={classes.containerBox} p="xl">
          <Title fw={500} mb="md" order={1} size="h2" ta="center">
            {t("Login")}
          </Title>

          {!data?.enforceSso && (
            <>
              <form onSubmit={form.onSubmit(onSubmit, handleValidationFailure)}>
                <TextInput
                  autoComplete="email"
                  errorProps={{ role: "alert" }}
                  id="email"
                  label={t("Email")}
                  placeholder="email@example.com"
                  type="email"
                  variant="filled"
                  {...form.getInputProps("email")}
                />

                <PasswordInput
                  autoComplete="current-password"
                  errorProps={{ role: "alert" }}
                  id="password"
                  label={t("Password")}
                  mt="md"
                  placeholder={t("Your password")}
                  variant="filled"
                  visibilityToggleButtonProps={{
                    "aria-hidden": false,
                    "aria-label": t("Toggle password visibility"),
                    tabIndex: 0,
                  }}
                  {...form.getInputProps("password")}
                />

                <Group justify="flex-end" mt="sm">
                  <Anchor
                    component={Link}
                    size="sm"
                    to={APP_ROUTE.AUTH.FORGOT_PASSWORD}
                    underline="never"
                  >
                    {t("Forgot your password?")}
                  </Anchor>
                </Group>

                <Button fullWidth loading={isLoading} mt="md" type="submit">
                  {t("Sign In")}
                </Button>
              </form>
            </>
          )}
        </Box>
      </Container>
    </AuthLayout>
  );
}
