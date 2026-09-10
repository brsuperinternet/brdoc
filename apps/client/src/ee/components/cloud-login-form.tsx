import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod/v4";
import { useJoinedWorkspacesQuery } from "@/ee/cloud/query/cloud-query.ts";
import { findWorkspacesByEmail } from "@/ee/cloud/service/cloud-service.ts";
import JoinedWorkspaces from "@/ee/components/joined-workspaces.tsx";
import { AuthLayout } from "@/features/auth/components/auth-layout.tsx";
import { getCheckHostname } from "@/features/workspace/services/workspace-service.ts";
import APP_ROUTE from "@/lib/app-route.ts";
import { getSubdomainHost } from "@/lib/config.ts";
import classes from "../../features/auth/components/auth.module.css";

const formSchema = z.object({
  hostname: z.string().min(1, { message: "subdomain is required" }),
});

const findWorkspaceSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

export function CloudLoginForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFindLoading, setIsFindLoading] = useState<boolean>(false);
  const [findEmailSent, setFindEmailSent] = useState<boolean>(false);
  const { data: joinedWorkspaces } = useJoinedWorkspacesQuery();

  const form = useForm<any>({
    initialValues: {
      hostname: "",
    },
    validate: zod4Resolver(formSchema),
  });

  const findForm = useForm<any>({
    initialValues: {
      email: "",
    },
    validate: zod4Resolver(findWorkspaceSchema),
  });

  async function onSubmit(data: { hostname: string }) {
    setIsLoading(true);

    try {
      const checkHostname = await getCheckHostname(data.hostname);
      window.location.href = checkHostname.hostname;
    } catch (err) {
      if (err?.status === 404) {
        form.setFieldError("hostname", "We could not find this workspace");
      } else {
        form.setFieldError("hostname", "An error occurred");
      }
    }

    setIsLoading(false);
  }

  async function onFindSubmit(data: { email: string }) {
    setIsFindLoading(true);

    try {
      await findWorkspacesByEmail(data.email);
      setFindEmailSent(true);
    } catch {
      findForm.setFieldError("email", "An error occurred. Please try again.");
    }

    setIsFindLoading(false);
  }

  return (
    <AuthLayout>
      <Container className={classes.container} size={420}>
        <Box className={classes.containerBox} p="xl">
          <Title fw={500} mb="md" order={2} ta="center">
            {t("Login")}
          </Title>

          <JoinedWorkspaces />

          {joinedWorkspaces?.length > 0 && (
            <Divider label="OR" labelPosition="center" my="xs" />
          )}

          <form onSubmit={form.onSubmit(onSubmit)}>
            <TextInput
              description="Enter your workspace hostname"
              label="Workspace hostname"
              placeholder="my-team"
              rightSection={<Text fw={500}>.{getSubdomainHost()}</Text>}
              rightSectionWidth={150}
              type="text"
              withErrorStyles={false}
              {...form.getInputProps("hostname")}
            />
            <Button fullWidth loading={isLoading} mt="xl" type="submit">
              {t("Continue")}
            </Button>
          </form>

          <Divider label="or" labelPosition="center" my="lg" />

          {findEmailSent ? (
            <Text c="dimmed" size="sm" ta="center">
              {t("We've sent you an email with your associated workspaces.")}
            </Text>
          ) : (
            <form onSubmit={findForm.onSubmit(onFindSubmit)}>
              <Text fw={600} mb="xs">
                {t("Find your workspaces")}
              </Text>
              <TextInput
                description={t(
                  "We'll send a list of your workspaces to this email."
                )}
                placeholder="name@company.com"
                type="email"
                withErrorStyles={false}
                {...findForm.getInputProps("email")}
              />
              <Button
                fullWidth
                loading={isFindLoading}
                mt="md"
                type="submit"
                variant="light"
              >
                {t("Send")}
              </Button>
            </form>
          )}
        </Box>
      </Container>

      <Text mb="xl" ta="center">
        {t("Don't have a workspace?")}{" "}
        <Anchor component={Link} fw={500} to={APP_ROUTE.AUTH.CREATE_WORKSPACE}>
          {t("Create new workspace")}
        </Anchor>
      </Text>
    </AuthLayout>
  );
}
