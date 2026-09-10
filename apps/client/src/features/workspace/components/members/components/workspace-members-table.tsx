import { Badge, Group, Table, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import NoTableResults from "@/components/common/no-table-results.tsx";
import Paginate from "@/components/common/paginate.tsx";
import { SearchInput } from "@/components/common/search-input.tsx";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import RoleSelectMenu from "@/components/ui/role-select-menu.tsx";
import MemberActionMenu from "@/features/workspace/components/members/components/members-action-menu.tsx";
import {
  useChangeMemberRoleMutation,
  useWorkspaceMembersQuery,
} from "@/features/workspace/queries/workspace-query.ts";
import {
  getUserRoleLabel,
  userRoleData,
} from "@/features/workspace/types/user-role-data.ts";
import { usePaginateAndSearch } from "@/hooks/use-paginate-and-search.tsx";
import useUserRole from "@/hooks/use-user-role.tsx";
import { UserRole } from "@/lib/types.ts";

export default function WorkspaceMembersTable() {
  const { t } = useTranslation();
  const { search, cursor, goNext, goPrev, handleSearch } =
    usePaginateAndSearch();
  const { data, isLoading } = useWorkspaceMembersQuery({
    cursor,
    limit: 100,
    query: search,
  });
  const changeMemberRoleMutation = useChangeMemberRoleMutation();
  const { isAdmin, isOwner } = useUserRole();

  const assignableUserRoles = isOwner
    ? userRoleData
    : userRoleData.filter((role) => role.value !== UserRole.OWNER);

  const handleRoleChange = async (
    userId: string,
    currentRole: string,
    newRole: string
  ) => {
    if (newRole === currentRole) {
      return;
    }

    const memberRoleUpdate = {
      role: newRole,
      userId,
    };

    await changeMemberRoleMutation.mutateAsync(memberRoleUpdate);
  };

  return (
    <>
      <SearchInput onSearch={handleSearch} />
      <Table.ScrollContainer minWidth={600}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("User")}</Table.Th>
              <Table.Th>{t("Status")}</Table.Th>
              <Table.Th>{t("Role")}</Table.Th>
              <Table.Th aria-label={t("Action")} />
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data?.items.length > 0 ? (
              data?.items.map((user, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <CustomAvatar
                        avatarUrl={user.avatarUrl}
                        name={user.name}
                      />
                      <div>
                        <Text fw={500} fz="sm" lineClamp={1}>
                          {user.name}
                        </Text>
                        <Text c="dimmed" fz="xs">
                          {user.email}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {user.deactivatedAt ? (
                      <Badge color="orange" variant="light">
                        {t("Deactivated")}
                      </Badge>
                    ) : (
                      <Badge variant="light">{t("Active")}</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {isAdmin ? (
                      <RoleSelectMenu
                        onChange={(newRole) =>
                          handleRoleChange(user.id, user.role, newRole)
                        }
                        roleName={getUserRoleLabel(user.role)}
                        roles={assignableUserRoles}
                      />
                    ) : (
                      <Text fz="sm">{t(getUserRoleLabel(user.role))}</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {isAdmin && (
                      <MemberActionMenu
                        deactivatedAt={user.deactivatedAt}
                        name={user.name}
                        userId={user.id}
                      />
                    )}
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <NoTableResults colSpan={3} />
            )}
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
