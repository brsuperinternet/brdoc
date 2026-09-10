import { Group, Table, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import NoTableResults from "@/components/common/no-table-results.tsx";
import Paginate from "@/components/common/paginate.tsx";
import { SearchInput } from "@/components/common/search-input.tsx";
import { AutoTooltipText } from "@/components/ui/auto-tooltip-text.tsx";
import rowClasses from "@/components/ui/clickable-table-row.module.css";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import SpaceSettingsModal from "@/features/space/components/settings-modal.tsx";
import { useGetSpacesQuery } from "@/features/space/queries/space-query.ts";
import { usePaginateAndSearch } from "@/hooks/use-paginate-and-search.tsx";
import { formatMemberCount } from "@/lib";

export default function SpaceList() {
  const { t } = useTranslation();
  const { search, cursor, goNext, goPrev, handleSearch } =
    usePaginateAndSearch();
  const { data, isLoading } = useGetSpacesQuery({ cursor, query: search });
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(null);

  const handleClick = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    open();
  };

  return (
    <>
      <SearchInput onSearch={handleSearch} />
      <Table.ScrollContainer minWidth={500}>
        <Table highlightOnHover layout="fixed" verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Space")}</Table.Th>
              <Table.Th>{t("Members")}</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data?.items.length > 0 ? (
              data?.items.map((space, index) => (
                <Table.Tr
                  aria-label={t("Open settings for {{name}}", {
                    name: space.name,
                  })}
                  className={rowClasses.row}
                  key={index}
                  onClick={() => handleClick(space.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleClick(space.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <CustomAvatar
                        avatarUrl={space.logo}
                        color="initials"
                        name={space.name}
                        type={AvatarIconType.SPACE_ICON}
                        variant="filled"
                      />
                      <div style={{ minWidth: 0, overflow: "hidden" }}>
                        <AutoTooltipText fw={500} fz="sm" lineClamp={1}>
                          {space.name}
                        </AutoTooltipText>
                        <Text c="dimmed" fz="xs" lineClamp={2}>
                          {space.description}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" style={{ whiteSpace: "nowrap" }}>
                      {formatMemberCount(space.memberCount, t)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <NoTableResults colSpan={2} />
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

      {selectedSpaceId && (
        <SpaceSettingsModal
          onClose={close}
          opened={opened}
          spaceId={selectedSpaceId}
        />
      )}
    </>
  );
}
