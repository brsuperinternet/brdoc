import { Anchor, Group, Table, Text, VisuallyHidden } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import NoTableResults from "@/components/common/no-table-results.tsx";
import Paginate from "@/components/common/paginate.tsx";
import { SearchInput } from "@/components/common/search-input.tsx";
import { IconGroupCircle } from "@/components/icons/icon-people-circle.tsx";
import { AutoTooltipText } from "@/components/ui/auto-tooltip-text.tsx";
import rowClasses from "@/components/ui/clickable-table-row.module.css";
import GroupActionMenu from "@/features/group/components/group-action-menu.tsx";
import { useGetGroupsQuery } from "@/features/group/queries/group-query";
import { getGroupMembers } from "@/features/group/services/group-service.ts";
import { IGroup } from "@/features/group/types/group.types.ts";
import { usePaginateAndSearch } from "@/hooks/use-paginate-and-search.tsx";
import { formatMemberCount } from "@/lib";
import { queryClient } from "@/main.tsx";

export default function GroupList() {
  const { t } = useTranslation();
  const { search, cursor, goNext, goPrev, handleSearch } =
    usePaginateAndSearch();
  const { data, isLoading } = useGetGroupsQuery({ cursor, query: search });

  const prefetchGroupMembers = (groupId: string) => {
    queryClient.prefetchQuery({
      queryFn: () => getGroupMembers(groupId, {}),
      queryKey: ["groupMembers", groupId, {}],
    });
  };

  return (
    <>
      <SearchInput onSearch={handleSearch} />
      <Table.ScrollContainer minWidth={500}>
        <Table highlightOnHover layout="fixed" verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Group")}</Table.Th>
              <Table.Th>{t("Members")}</Table.Th>
              <Table.Th w={60}>
                <VisuallyHidden>{t("Actions")}</VisuallyHidden>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data?.items.length > 0 ? (
              data?.items.map((group: IGroup, index: number) => (
                <Table.Tr className={rowClasses.row} key={index}>
                  <Table.Td onMouseEnter={() => prefetchGroupMembers(group.id)}>
                    <Anchor
                      className={rowClasses.link}
                      component={Link}
                      size="sm"
                      style={{
                        color: "var(--mantine-color-text)",
                        cursor: "pointer",
                      }}
                      to={`/settings/groups/${group.id}`}
                      underline="never"
                    >
                      <Group gap="sm" wrap="nowrap">
                        <IconGroupCircle />
                        <div style={{ minWidth: 0, overflow: "hidden" }}>
                          <AutoTooltipText fw={500} fz="sm" lineClamp={1}>
                            {group.name}
                          </AutoTooltipText>
                          <Text c="dimmed" fz="xs" lineClamp={2}>
                            {group.description}
                          </Text>
                        </div>
                      </Group>
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <Anchor
                      component={Link}
                      size="sm"
                      style={{
                        color: "var(--mantine-color-text)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      to={`/settings/groups/${group.id}`}
                      underline="never"
                    >
                      {formatMemberCount(group.memberCount, t)}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>
                    <GroupActionMenu group={group} />
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
