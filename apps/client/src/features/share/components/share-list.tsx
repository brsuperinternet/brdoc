import { Anchor, Group, Table, Text } from "@mantine/core";
import { IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Paginate from "@/components/common/paginate.tsx";
import rowClasses from "@/components/ui/clickable-table-row.module.css";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { buildSharedPageUrl } from "@/features/page/page.utils.ts";
import ShareActionMenu from "@/features/share/components/share-action-menu.tsx";
import { useGetSharesQuery } from "@/features/share/queries/share-query.ts";
import { ISharedItem } from "@/features/share/types/share.types.ts";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";
import { getPageIcon } from "@/lib";
import { formatLocalized, useDateFnsLocale } from "@/lib/date-locale.ts";
import classes from "./share.module.css";

export default function ShareList() {
  const { t } = useTranslation();
  const { cursor, goNext, goPrev } = useCursorPaginate();
  const { data, isLoading } = useGetSharesQuery({ cursor });
  const locale = useDateFnsLocale();

  if (!isLoading && data?.items.length === 0) {
    return <EmptyState icon={IconWorld} title={t("No shared pages")} />;
  }

  return (
    <>
      <Table.ScrollContainer minWidth={500}>
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Page")}</Table.Th>
              <Table.Th>{t("Shared by")}</Table.Th>
              <Table.Th>{t("Shared at")}</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data?.items.map((share: ISharedItem, index: number) => (
              <Table.Tr className={rowClasses.row} key={index}>
                <Table.Td>
                  <Anchor
                    className={rowClasses.link}
                    component={Link}
                    size="sm"
                    style={{
                      color: "var(--mantine-color-text)",
                      cursor: "pointer",
                    }}
                    target="_blank"
                    to={buildSharedPageUrl({
                      pageSlugId: share.page.slugId,
                      pageTitle: share.page.title,
                      shareId: share.key,
                    })}
                    underline="never"
                  >
                    <Group gap="4" wrap="nowrap">
                      {getPageIcon(share.page.icon)}
                      <div className={classes.shareLinkText}>
                        <Text fw={500} fz="sm" lineClamp={1}>
                          {share.page.title || t("untitled")}
                        </Text>
                      </div>
                    </Group>
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Group gap="4" wrap="nowrap">
                    <CustomAvatar
                      avatarUrl={share.creator?.avatarUrl}
                      name={share.creator.name}
                      size="sm"
                    />
                    <Text fz="sm" lineClamp={1}>
                      {share.creator.name}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm" style={{ whiteSpace: "nowrap" }}>
                    {formatLocalized(
                      share.createdAt,
                      "MMM dd, yyyy",
                      "PP",
                      locale
                    )}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <ShareActionMenu share={share} />
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
