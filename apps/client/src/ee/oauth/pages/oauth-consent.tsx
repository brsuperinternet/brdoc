import {
  Alert,
  Anchor,
  Box,
  Button,
  Center,
  Checkbox,
  Container,
  Divider,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconEye, IconPencil } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { RESET } from "jotai/utils";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router-dom";
import { UserInfo } from "@/components/common/user-info.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import {
  approveOAuthAuthorization,
  getOAuthAuthorizeInfo,
} from "@/ee/oauth/services/oauth-service";
import {
  IApproveAuthorizationPayload,
  IAuthorizeParams,
  IOAuthAuthorizeInfo,
} from "@/ee/oauth/types/oauth.types";
import classes from "@/features/auth/components/auth.module.css";
import { AuthLayout } from "@/features/auth/components/auth-layout.tsx";
import { logout } from "@/features/auth/services/auth-service";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import useCurrentUser from "@/features/user/hooks/use-current-user";
import { ICurrentUser } from "@/features/user/types/user.types";
import APP_ROUTE from "@/lib/app-route.ts";

function loginRedirectUrl(pathname: string, search: string): string {
  return `${APP_ROUTE.AUTH.LOGIN}?redirect=${encodeURIComponent(pathname + search)}`;
}

function errorStatus(error: any): number | undefined {
  return error?.response?.status;
}

function errorText(error: any): string | undefined {
  const data = error?.response?.data;
  if (typeof data?.error_description === "string") {
    return data.error_description;
  }
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }
  return data?.message;
}

const OAUTH_PARAM_NAMES = [
  "response_type",
  "client_id",
  "redirect_uri",
  "state",
  "code_challenge",
  "code_challenge_method",
  "scope",
  "resource",
];

function pickOAuthParams(params: IAuthorizeParams): IAuthorizeParams {
  const picked: IAuthorizeParams = {};
  for (const name of OAUTH_PARAM_NAMES) {
    if (params[name] !== undefined) {
      picked[name] = params[name];
    }
  }
  return picked;
}

export default function OAuthConsent() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const params = useMemo<IAuthorizeParams>(
    () => Object.fromEntries(searchParams.entries()),
    [searchParams]
  );

  const currentUserQuery = useCurrentUser();
  const infoQuery = useQuery({
    queryFn: () => getOAuthAuthorizeInfo(params),
    queryKey: ["oauth-authorize-info", params],
  });

  const isUnauthenticated =
    errorStatus(currentUserQuery.error) === 401 ||
    errorStatus(infoQuery.error) === 401;

  useEffect(() => {
    if (isUnauthenticated) {
      window.location.replace(
        loginRedirectUrl(location.pathname, location.search)
      );
    }
  }, [isUnauthenticated, location.pathname, location.search]);

  const isLoading =
    isUnauthenticated || currentUserQuery.isLoading || infoQuery.isLoading;

  return (
    <AuthLayout>
      <DocumentTitle title={t("Authorize application")} />
      <Container className={classes.container} size={460}>
        <Box p="xl">
          {isLoading ? (
            <Center mih={200}>
              <Loader />
            </Center>
          ) : infoQuery.data && currentUserQuery.data ? (
            <ConsentCard
              currentUser={currentUserQuery.data}
              info={infoQuery.data}
              params={params}
            />
          ) : (
            <InvalidRequestCard
              description={errorText(infoQuery.error ?? currentUserQuery.error)}
            />
          )}
        </Box>
      </Container>
    </AuthLayout>
  );
}

function InvalidRequestCard({ description }: { description?: string }) {
  const { t } = useTranslation();

  return (
    <Stack align="center" gap="sm">
      <ThemeIcon color="red" radius="xl" size={48} variant="light">
        <IconAlertTriangle size={26} stroke={1.5} />
      </ThemeIcon>
      <Title fw={600} order={3} ta="center">
        {t("Invalid authorization request")}
      </Title>
      {description && (
        <Text c="dimmed" size="sm" ta="center">
          {description}
        </Text>
      )}
    </Stack>
  );
}

type ConsentCardProps = {
  info: IOAuthAuthorizeInfo;
  currentUser: ICurrentUser;
  params: IAuthorizeParams;
};

function ConsentCard({ info, currentUser, params }: ConsentCardProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [, setCurrentUser] = useAtom(currentUserAtom);
  const [approvedScopes, setApprovedScopes] = useState<string[]>(
    info.scopes.filter((scope) => scope === "read" || scope === "write")
  );
  const [submitting, setSubmitting] = useState<"approve" | "deny" | null>(null);

  const scopeRows = [
    {
      description: t("View data in your workspace without making changes."),
      icon: <IconEye size={16} stroke={1.5} />,
      label: t("Read"),
      scope: "read",
    },
    {
      description: t("Create and modify data in your workspace."),
      icon: <IconPencil size={16} stroke={1.5} />,
      label: t("Write"),
      scope: "write",
    },
  ];

  function toggleScope(scope: string, checked: boolean) {
    setApprovedScopes((prev) =>
      checked ? [...prev, scope] : prev.filter((item) => item !== scope)
    );
  }

  async function submitDecision(approved: boolean) {
    setSubmitting(approved ? "approve" : "deny");
    const oauthParams = pickOAuthParams(params);
    const payload: IApproveAuthorizationPayload = approved
      ? { ...oauthParams, approved: true, approvedScopes }
      : { ...oauthParams, approved: false };

    try {
      const res = await approveOAuthAuthorization(payload);
      window.location.replace(res.redirectUrl);
    } catch (err) {
      if (errorStatus(err) === 401) {
        window.location.replace(
          loginRedirectUrl(location.pathname, location.search)
        );
        return;
      }
      setSubmitting(null);
      notifications.show({
        color: "red",
        message: errorText(err) || t("Something went wrong. Please try again."),
      });
    }
  }

  async function switchAccount() {
    if (submitting !== null) {
      return;
    }
    setCurrentUser(RESET);
    try {
      await logout();
    } finally {
      window.location.replace(
        loginRedirectUrl(location.pathname, location.search)
      );
    }
  }

  return (
    <Stack gap="lg">
      <Title fw={600} order={3} ta="center">
        {t("{{name}} wants to access {{workspace}}", {
          name: info.clientName,
          workspace: currentUser.workspace.name,
        })}
      </Title>

      <Paper p="sm" radius="md" withBorder>
        <Group justify="space-between" wrap="nowrap">
          <UserInfo user={currentUser.user} />
          <Anchor
            c="dimmed"
            component="button"
            disabled={submitting !== null}
            onClick={switchAccount}
            size="xs"
            style={{ whiteSpace: "nowrap" }}
            type="button"
          >
            {t("Not you? Switch account")}
          </Anchor>
        </Group>
      </Paper>

      <Divider />

      <Stack gap="sm">
        <Text fw={500} size="sm">
          {t("This application will be able to:")}
        </Text>
        {scopeRows.map((row) => {
          const requested = info.scopes.includes(row.scope);
          return (
            <Checkbox
              checked={approvedScopes.includes(row.scope)}
              description={row.description}
              disabled={!requested || submitting !== null}
              key={row.scope}
              label={
                <Group gap={6} wrap="nowrap">
                  {row.icon}
                  <Text fw={500} size="sm">
                    {row.label}
                  </Text>
                </Group>
              }
              onChange={(event) =>
                toggleScope(row.scope, event.currentTarget.checked)
              }
              size="sm"
            />
          );
        })}
      </Stack>

      <div>
        <Text c="dimmed" size="xs">
          {t("You will be redirected to")}
        </Text>
        <Text ff="monospace" size="xs" style={{ overflowWrap: "anywhere" }}>
          {info.redirectUri}
        </Text>
      </div>

      {!info.verified && (
        <Alert
          color="yellow"
          icon={<IconAlertTriangle size={16} />}
          py="xs"
          variant="light"
        >
          {t("Make sure you trust this application before authorizing it.")}
        </Alert>
      )}

      <Group grow>
        <Button
          disabled={submitting === "approve"}
          loading={submitting === "deny"}
          onClick={() => submitDecision(false)}
          variant="default"
        >
          {t("Cancel")}
        </Button>
        <Button
          disabled={approvedScopes.length === 0 || submitting === "deny"}
          loading={submitting === "approve"}
          onClick={() => submitDecision(true)}
        >
          {t("Authorize")}
        </Button>
      </Group>
    </Stack>
  );
}
