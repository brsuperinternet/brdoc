import { ActionIcon, Badge, Group, Menu, Table, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconDots } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import NoTableResults from "@/components/common/no-table-results.tsx";
import Paginate from "@/components/common/paginate.tsx";
import { SearchInput } from "@/components/common/search-input.tsx";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import {
  useGroupMembersQuery,
  useRemoveGroupMemberMutation,
} from "@/features/group/queries/group-query";
import { IUser } from "@/features/user/types/user.types.ts";
import { usePaginateAndSearch } from "@/hooks/use-paginate-and-search.tsx";
import useUserRole from "@/hooks/use-user-role.tsx";

export default function GroupMembersList() {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const { search, cursor, goNext, goPrev, handleSearch } =
    usePaginateAndSearch();
  const { data, isLoading } = useGroupMembersQuery(groupId, {
    cursor,
    query: search,
  });
  const removeGroupMember = useRemoveGroupMemberMutation();
  const { isAdmin } = useUserRole();

  const onRemove = async (userId: string) => {
    const memberToRemove = {
      groupId,
      userId,
    };
    await removeGroupMember.mutateAsync(memberToRemove);
  };

  const openRemoveModal = (userId: string) =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to remove this user from the group? The user will lose access to resources this group has access to."
          )}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Delete") },
      onConfirm: () => onRemove(userId),
      title: t("Remove group member"),
    });

  return (
    <>
      <SearchInput onSearch={handleSearch} />
      <Table.ScrollContainer minWidth={500}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("User")}</Table.Th>
              <Table.Th>{t("Status")}</Table.Th>
              <Table.Th aria-label={t("Action")} />
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data?.items.length > 0 ? (
              data?.items.map((user: IUser, index: number) => (
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
                    <Badge variant="light">{t("Active")}</Badge>
                  </Table.Td>
                  <Table.Td>
                    {isAdmin && (
                      <Menu
                        arrowPosition="center"
                        offset={20}
                        position="bottom-end"
                        shadow="xl"
                        width={200}
                        withArrow
                      >
                        <Menu.Target>
                          <ActionIcon
                            aria-label={t("Member actions for {{name}}", {
                              name: user.name,
                            })}
                            c="gray"
                            variant="subtle"
                          >
                            <IconDots size={20} stroke={2} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => openRemoveModal(user.id)}>
                            {t("Remove group member")}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
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
