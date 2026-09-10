import { Alert, Avatar, Group, Table, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import Paginate from "@/components/common/paginate.tsx";
import InviteActionMenu from "@/features/workspace/components/members/components/invite-action-menu.tsx";
import { useWorkspaceInvitationsQuery } from "@/features/workspace/queries/workspace-query.ts";
import { getUserRoleLabel } from "@/features/workspace/types/user-role-data.ts";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";
import useUserRole from "@/hooks/use-user-role.tsx";
import { timeAgo } from "@/lib/time.ts";

export default function WorkspaceInvitesTable() {
  const { t } = useTranslation();
  const { cursor, goNext, goPrev } = useCursorPaginate();
  const { data, isLoading } = useWorkspaceInvitationsQuery({
    cursor,
    limit: 100,
  });
  const { isAdmin } = useUserRole();

  return (
    <>
      <Alert color="blue" icon={<IconInfoCircle />} variant="light">
        {t(
          "Invited members who are yet to accept their invitation will appear here."
        )}
      </Alert>

      <Table.ScrollContainer minWidth={600}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Email")}</Table.Th>
              <Table.Th>{t("Role")}</Table.Th>
              <Table.Th>{t("Date")}</Table.Th>
              <Table.Th aria-label={t("Action")} />
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data?.items.map((invitation, index) => (
              <Table.Tr key={index}>
                <Table.Td>
                  <Group gap="sm" wrap="nowrap">
                    <Avatar color="initials" name={invitation.email} />
                    <div>
                      <Text fw={500} fz="sm">
                        {invitation.email}
                      </Text>
                    </div>
                  </Group>
                </Table.Td>

                <Table.Td>{t(getUserRoleLabel(invitation.role))}</Table.Td>

                <Table.Td>{timeAgo(invitation.createdAt)}</Table.Td>

                <Table.Td>
                  {isAdmin && <InviteActionMenu invitationId={invitation.id} />}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {data?.items.length > 0 && (
        <Paginate
          hasNextPage={data?.meta?.hasNextPage}
          hasPrevPage={data?.meta?.hasPrevPage}
          onNext={() => goNext(data?.meta?.nextCursor)}
          onPrev={goPrev}
        />
      )}
    </>
  );
}
