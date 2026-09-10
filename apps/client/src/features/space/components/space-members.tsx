import {
  ActionIcon,
  Center,
  Group,
  Loader,
  Menu,
  ScrollArea,
  Table,
  Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconDots } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@/components/common/search-input.tsx";
import { IconGroupCircle } from "@/components/icons/icon-people-circle.tsx";
import { AutoTooltipText } from "@/components/ui/auto-tooltip-text.tsx";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import RoleSelectMenu from "@/components/ui/role-select-menu.tsx";
import {
  useChangeSpaceMemberRoleMutation,
  useRemoveSpaceMemberMutation,
  useSpaceMembersInfiniteQuery,
} from "@/features/space/queries/space-query.ts";
import { IRemoveSpaceMember } from "@/features/space/types/space.types.ts";
import {
  getSpaceRoleLabel,
  spaceRoleData,
} from "@/features/space/types/space-role-data.ts";
import { formatMemberCount } from "@/lib";

type MemberType = "user" | "group";

interface SpaceMembersProps {
  readOnly?: boolean;
  spaceId: string;
}

export default function SpaceMembersList({
  spaceId,
  readOnly,
}: SpaceMembersProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const handleSearch = useCallback((query: string) => setSearch(query), []);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSpaceMembersInfiniteQuery(spaceId, search);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: viewportRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const removeSpaceMember = useRemoveSpaceMemberMutation();
  const changeSpaceMemberRoleMutation = useChangeSpaceMemberRoleMutation();

  const handleRoleChange = async (
    memberId: string,
    type: MemberType,
    newRole: string,
    currentRole: string
  ) => {
    if (newRole === currentRole) {
      return;
    }

    const memberRoleUpdate: {
      spaceId: string;
      role: string;
      userId?: string;
      groupId?: string;
    } = {
      role: newRole,
      spaceId,
    };

    if (type === "user") {
      memberRoleUpdate.userId = memberId;
    }
    if (type === "group") {
      memberRoleUpdate.groupId = memberId;
    }

    await changeSpaceMemberRoleMutation.mutateAsync(memberRoleUpdate);
  };

  const onRemove = async (memberId: string, type: MemberType) => {
    const memberToRemove: IRemoveSpaceMember = {
      spaceId,
    };

    if (type === "user") {
      memberToRemove.userId = memberId;
    }
    if (type === "group") {
      memberToRemove.groupId = memberId;
    }

    await removeSpaceMember.mutateAsync(memberToRemove);
  };

  const openRemoveModal = (memberId: string, type: MemberType) =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to remove this user from the space? The user will lose all access to this space."
          )}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Remove") },
      onConfirm: () => onRemove(memberId, type),
      title: t("Remove space member"),
    });

  const members = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <SearchInput onSearch={handleSearch} />
      <ScrollArea h={450} viewportRef={viewportRef}>
        <Table.ScrollContainer minWidth={500}>
          <Table highlightOnHover verticalSpacing={8}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("Member")}</Table.Th>
                <Table.Th>{t("Role")}</Table.Th>
                <Table.Th aria-label={t("Action")} />
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {members.map((member, index) => (
                <Table.Tr key={index}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      {member.type === "user" && (
                        <CustomAvatar
                          avatarUrl={member?.avatarUrl}
                          name={member.name}
                        />
                      )}

                      {member.type === "group" && <IconGroupCircle />}

                      <div
                        style={{
                          maxWidth: 260,
                          minWidth: 0,
                          overflow: "hidden",
                        }}
                      >
                        <AutoTooltipText fw={500} fz="sm">
                          {member?.name}
                        </AutoTooltipText>
                        <Text c="dimmed" fz="xs">
                          {member.type == "user" && member?.email}

                          {member.type == "group" &&
                            `${t("Group")} - ${formatMemberCount(member?.memberCount, t)}`}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>

                  <Table.Td>
                    {readOnly ? (
                      <Text fz="sm">{t(getSpaceRoleLabel(member.role))}</Text>
                    ) : (
                      <RoleSelectMenu
                        onChange={(newRole) =>
                          handleRoleChange(
                            member.id,
                            member.type,
                            newRole,
                            member.role
                          )
                        }
                        roleName={getSpaceRoleLabel(member.role)}
                        roles={spaceRoleData}
                      />
                    )}
                  </Table.Td>

                  <Table.Td>
                    {!readOnly && (
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
                              name: member.name,
                            })}
                            c="gray"
                            variant="subtle"
                          >
                            <IconDots size={20} stroke={2} />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item
                            onClick={() =>
                              openRemoveModal(member.id, member.type)
                            }
                          >
                            {t("Remove space member")}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <div ref={sentinelRef} style={{ height: 1 }} />

        {isFetchingNextPage && (
          <Center py="xs">
            <Loader size="xs" />
          </Center>
        )}
      </ScrollArea>
    </>
  );
}
