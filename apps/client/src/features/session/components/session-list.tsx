import {
  Button,
  Divider,
  Group,
  Skeleton,
  Stack,
  Table,
  Text,
  VisuallyHidden,
} from "@mantine/core";
import { IconDevices } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useGetSessionsQuery,
  useRevokeAllSessionsMutation,
  useRevokeSessionMutation,
} from "@/features/session/queries/session-query";
import { formattedDate } from "@/lib/time";

const PAGE_SIZE = 5;

export default function SessionList() {
  const { t } = useTranslation();
  const { data: sessions, isLoading } = useGetSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeAllSessionsMutation = useRevokeAllSessionsMutation();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const otherSessions = sessions?.filter((s) => !s?.isCurrentDevice) ?? [];
  const visibleSessions = sessions?.slice(0, visibleCount) ?? [];
  const hasMore = sessions && visibleCount < sessions.length;

  if (isLoading) {
    return (
      <Table verticalSpacing="md">
        <Table.Caption>
          <VisuallyHidden>{t("Active sessions")}</VisuallyHidden>
        </Table.Caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("Device Name")}</Table.Th>
            <Table.Th>{t("Last Active")}</Table.Th>
            <Table.Th>
              <VisuallyHidden>{t("Action")}</VisuallyHidden>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {[1, 2, 3].map((i) => (
            <Table.Tr key={i}>
              <Table.Td>
                <Group gap="xs">
                  <Skeleton height={18} radius="sm" width={18} />
                  <Skeleton height={14} radius="xs" width={140} />
                </Group>
              </Table.Td>
              <Table.Td>
                <Skeleton height={14} radius="xs" width={120} />
              </Table.Td>
              <Table.Td>
                <Skeleton height={30} radius="sm" width={70} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  }

  return (
    <Stack>
      {otherSessions.length > 0 && (
        <>
          <div>
            <Text fw={500}>{t("Log out of all devices")}</Text>
            <Group align="center" justify="space-between" mt={4}>
              <Text c="dimmed" size="sm">
                {t("Log out of all sessions except this device")}
              </Text>
              <Button
                color="red"
                loading={revokeAllSessionsMutation.isPending}
                onClick={() => revokeAllSessionsMutation.mutate()}
                size="xs"
                variant="outline"
              >
                {t("Log out of all devices")}
              </Button>
            </Group>
          </div>
          <Divider />
        </>
      )}

      <Table verticalSpacing="md">
        <Table.Caption>
          <VisuallyHidden>{t("Active sessions")}</VisuallyHidden>
        </Table.Caption>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("Device Name")}</Table.Th>
            <Table.Th>{t("Last Active")}</Table.Th>
            {otherSessions.length > 0 && (
              <Table.Th>
                <VisuallyHidden>{t("Action")}</VisuallyHidden>
              </Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visibleSessions.map((session) => (
            <Table.Tr key={session.id}>
              <Table.Td>
                <Group gap="xs">
                  <IconDevices size={18} stroke={1.5} />
                  <div>
                    <Text size="sm">
                      {session.deviceName || t("Unknown device")}
                    </Text>
                    {session?.isCurrentDevice && (
                      <Text c="blue" size="xs">
                        {t("This Device")}
                      </Text>
                    )}
                  </div>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {session?.isCurrentDevice
                    ? t("Now")
                    : formattedDate(new Date(session.lastActiveAt))}
                </Text>
              </Table.Td>
              {otherSessions.length > 0 && (
                <Table.Td>
                  {!session?.isCurrentDevice && (
                    <Button
                      loading={revokeSessionMutation.isPending}
                      onClick={() =>
                        revokeSessionMutation.mutate({
                          sessionId: session.id,
                        })
                      }
                      size="xs"
                      variant="outline"
                    >
                      {t("Log out")}
                    </Button>
                  )}
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {hasMore && (
        <Button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          size="xs"
          variant="subtle"
        >
          {t("Load more")}
        </Button>
      )}

      {(!sessions || sessions.length === 0) && (
        <Text c="dimmed" size="sm" ta="center">
          {t("No active sessions")}
        </Text>
      )}
    </Stack>
  );
}
