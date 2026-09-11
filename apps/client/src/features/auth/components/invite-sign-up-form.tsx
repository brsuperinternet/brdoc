import {
  Box,
  Button,
  Container,
  PasswordInput,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import { z } from "zod/v4";

import classes from "@/features/auth/components/auth.module.css";
import useAuth from "@/features/auth/hooks/use-auth";
import { useRedirectIfAuthenticated } from "@/features/auth/hooks/use-redirect-if-authenticated.ts";
import { useGetInvitationQuery } from "@/features/workspace/queries/workspace-query.ts";
import { AuthLayout } from "./auth-layout.tsx";

const formSchema = z.object({
  name: z.string().trim().min(1),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof formSchema>;

export function InviteSignUpForm() {
  const { t } = useTranslation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const { data: invitation, isError } = useGetInvitationQuery(
    params?.invitationId
  );
  const { invitationSignup, isLoading } = useAuth();
  useRedirectIfAuthenticated();

  const form = useForm<FormValues>({
    initialValues: {
      name: "",
      password: "",
    },
    validate: zod4Resolver(formSchema),
  });

  async function onSubmit(data: FormValues) {
    const invitationToken = searchParams.get("token");

    await invitationSignup({
      invitationId: invitation.id,
      name: data.name,
      password: data.password,
      token: invitationToken,
    });
  }

  if (isError) {
    return <div>{t("invalid invitation link")}</div>;
  }

  if (!invitation) {
    return <div />;
  }

  return (
    <AuthLayout>
      <Container className={classes.container} size={420}>
        <Box className={classes.containerBox} p="xl">
          <Title fw={500} mb="md" order={2} ta="center">
            {t("Join the workspace")}
          </Title>

          {!invitation.enforceSso && (
            <Stack align="stretch" gap="xl" justify="center">
              <form onSubmit={form.onSubmit(onSubmit)}>
                <TextInput
                  id="name"
                  label={t("Name")}
                  placeholder={t("enter your full name")}
                  type="text"
                  variant="filled"
                  {...form.getInputProps("name")}
                />

                <TextInput
                  disabled
                  id="email"
                  label={t("Email")}
                  mt="md"
                  type="email"
                  value={invitation.email}
                  variant="filled"
                />

                <PasswordInput
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
                <Button fullWidth loading={isLoading} mt="xl" type="submit">
                  {t("Sign Up")}
                </Button>
              </form>
            </Stack>
          )}
        </Box>
      </Container>
    </AuthLayout>
  );
}
