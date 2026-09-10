import {
  Anchor,
  Box,
  Button,
  Container,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod/v4";
import SsoCloudSignup from "@/ee/components/sso-cloud-signup.tsx";
import classes from "@/features/auth/components/auth.module.css";
import useAuth from "@/features/auth/hooks/use-auth";
import APP_ROUTE from "@/lib/app-route.ts";
import { isCloud } from "@/lib/config.ts";
import { AuthLayout } from "./auth-layout.tsx";

const formSchema = z.object({
  email: z
    .email({ message: "Invalid email address" })
    .min(1, { message: "Email is required" }),
  name: z.string().min(1, { message: "Name is required" }).max(50),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  workspaceName: z.string().trim().max(50).optional(),
});
type FormValues = z.infer<typeof formSchema>;

export function SetupWorkspaceForm() {
  const { t } = useTranslation();
  const { setupWorkspace, isLoading } = useAuth();
  // useRedirectIfAuthenticated();

  const form = useForm<FormValues>({
    initialValues: {
      email: "",
      name: "",
      password: "",
      workspaceName: "",
    },
    validate: zod4Resolver(formSchema),
  });

  async function onSubmit(data: FormValues) {
    await setupWorkspace(data);
  }

  return (
    <AuthLayout>
      <Container className={classes.container} size={420}>
        <Box className={classes.containerBox} p="xl">
          <Title fw={500} mb="md" order={2} ta="center">
            {t("Create workspace")}
          </Title>

          {isCloud() && <SsoCloudSignup />}

          <form onSubmit={form.onSubmit(onSubmit)}>
            {!isCloud() && (
              <TextInput
                id="workspaceName"
                label={t("Workspace Name")}
                mt="md"
                placeholder={t("e.g ACME Inc")}
                type="text"
                variant="filled"
                {...form.getInputProps("workspaceName")}
              />
            )}

            <TextInput
              id="name"
              label={t("Your Name")}
              mt="md"
              placeholder={t("enter your full name")}
              type="text"
              variant="filled"
              {...form.getInputProps("name")}
            />

            <TextInput
              id="email"
              label={t("Your Email")}
              mt="md"
              placeholder="email@example.com"
              type="email"
              variant="filled"
              {...form.getInputProps("email")}
            />

            <PasswordInput
              label={t("Password")}
              mt="md"
              placeholder={t("Enter a strong password")}
              variant="filled"
              visibilityToggleButtonProps={{
                "aria-hidden": false,
                "aria-label": t("Toggle password visibility"),
                tabIndex: 0,
              }}
              {...form.getInputProps("password")}
            />
            <Button fullWidth loading={isLoading} mt="xl" type="submit">
              {t("Create workspace")}
            </Button>
          </form>
        </Box>
      </Container>
      {isCloud() && (
        <Text ta="center">
          {t("Already part of an existing workspace?")}{" "}
          <Anchor
            component={Link}
            fw={500}
            to={APP_ROUTE.AUTH.SELECT_WORKSPACE}
          >
            {t("Sign-in")}
          </Anchor>
        </Text>
      )}
    </AuthLayout>
  );
}
