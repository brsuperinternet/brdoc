import {
  ActionIcon,
  Badge,
  Group,
  Skeleton,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import NoTableResults from "@/components/common/no-table-results";
import { useRevokeOAuthGrantMutation } from "@/ee/oauth/queries/oauth-query";
import { IOAuthGrant } from "@/ee/oauth/types/oauth.types";
import { formatLocalized, useDateFnsLocale } from "@/lib/date-locale.ts";

// Callback hosts identify the app; the full URL belongs on the consent screen.
function callbackHosts(redirectUris: string[] = []): string[] {
  const hosts = redirectUris.map((uri) => {
    try {
      const url = new URL(uri);
      return url.protocol === "http:" || url.protocol === "https:"
        ? url.host
        : url.protocol;
    } catch {
      return uri;
    }
  });
  return Array.from(new Set(hosts));
}

type OAuthGrantsTableProps = {
  grants: IOAuthGrant[];
  isLoading?: boolean;
};

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <Table.Tr key={i}>
          <Table.Td>
            <Skeleton height={14} width={140} />
          </Table.Td>
          <Table.Td>
            <Group gap={4}>
              <Skeleton height={20} width={50} />
              <Skeleton height={20} width={55} />
            </Group>
          </Table.Td>
          <Table.Td>
            <Skeleton height={14} width={90} />
          </Table.Td>
          <Table.Td>
            <Skeleton height={14} width={90} />
          </Table.Td>
          <Table.Td>
            <Skeleton circle height={28} width={28} />
          </Table.Td>
        </Table.Tr>
      ))}
    </>
  );
}

export function OAuthGrantsTable({ grants, isLoading }: OAuthGrantsTableProps) {
  const { t } = useTranslation();
  const locale = useDateFnsLocale();
  const revokeMutation = useRevokeOAuthGrantMutation();

  const scopeMeta: Record<string, { color: string; label: string }> = {
    read: { color: "blue", label: t("Read") },
    write: { color: "orange", label: t("Write") },
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return t("Never");
    }
    return formatLocalized(date, "MMM dd, yyyy", "PP", locale);
  };

  const openRevokeModal = (grant: IOAuthGrant) =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to revoke access for {{name}}? The application will no longer be able to access your account.",
            { name: grant.clientName }
          )}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Revoke access") },
      onConfirm: () => revokeMutation.mutate(grant.id),
      title: t("Revoke access"),
    });

  return (
    <Table.ScrollContainer minWidth={600}>
      <Table highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("Application")}</Table.Th>
            <Table.Th>{t("Permissions")}</Table.Th>
            <Table.Th>{t("Authorized")}</Table.Th>
            <Table.Th>{t("Last used")}</Table.Th>
            <Table.Th aria-label={t("Action")} />
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {isLoading ? (
            <TableSkeleton />
          ) : grants.length > 0 ? (
            grants.map((grant) => (
              <Table.Tr key={grant.id}>
                <Table.Td>
                  <Text fw={500} fz="sm">
                    {grant.clientName}
                  </Text>
                  <Text
                    c="dimmed"
                    fz="xs"
                    style={{ overflowWrap: "anywhere" }}
                    title={grant.redirectUris?.join("\n")}
                  >
                    {callbackHosts(grant.redirectUris).join(", ")}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Group gap={4}>
                    {grant.scopes.map((scope) => {
                      const meta = scopeMeta[scope];
                      if (!meta) {
                        return null;
                      }
                      return (
                        <Badge
                          color={meta.color}
                          key={scope}
                          size="sm"
                          variant="light"
                        >
                          {meta.label}
                        </Badge>
                      );
                    })}
                  </Group>
                </Table.Td>

                <Table.Td>
                  <Text fz="sm" style={{ whiteSpace: "nowrap" }}>
                    {formatDate(grant.createdAt)}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Text fz="sm" style={{ whiteSpace: "nowrap" }}>
                    {formatDate(grant.lastUsedAt)}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Tooltip label={t("Revoke access")}>
                    <ActionIcon
                      aria-label={t("Revoke access for {{name}}", {
                        name: grant.clientName,
                      })}
                      color="red"
                      onClick={() => openRevokeModal(grant)}
                      variant="subtle"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <NoTableResults colSpan={5} text={t("No authorized apps yet.")} />
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
