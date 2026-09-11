import {
  Badge,
  Button,
  Group,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconFiles } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageListIcon } from "@/components/common/page-list-icon";
import rowClasses from "@/components/ui/clickable-table-row.module.css";
import { EmptyState } from "@/components/ui/empty-state";
import PageListSkeleton from "@/components/ui/page-list-skeleton";
import { buildPageUrl, getPageTitle } from "@/features/page/page.utils";
import { useCreatedByQuery } from "@/features/page/queries/page-query";
import { getSpaceUrl } from "@/lib/config";
import { getInitialsColor } from "@/lib/get-initials-color";
import { formattedDate } from "@/lib/time";

type Props = {
  spaceId?: string;
};

export default function CreatedByMe({ spaceId }: Props) {
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCreatedByQuery({ spaceId });

  const pages = data?.pages.flatMap((p: any) => p.items) ?? [];

  if (isLoading) {
    return <PageListSkeleton />;
  }

  if (isError) {
    return <Text>{t("Failed to fetch pages")}</Text>;
  }

  return pages.length > 0 ? (
    <>
      <Table.ScrollContainer minWidth={500}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Tbody>
            {pages.map((page) => (
              <Table.Tr className={rowClasses.row} key={page.id}>
                <Table.Td>
                  <UnstyledButton
                    className={rowClasses.link}
                    component={Link}
                    to={buildPageUrl(page?.space.slug, page.slugId, page.title)}
                  >
                    <Group wrap="nowrap">
                      <PageListIcon icon={page.icon} isBase={page.isBase} />
                      <Text fw={500} lineClamp={1} size="md">
                        {getPageTitle(page.title, page.isBase, t)}
                      </Text>
                    </Group>
                  </UnstyledButton>
                </Table.Td>
                {!spaceId && (
                  <Table.Td>
                    <Badge
                      color={getInitialsColor(page?.space.name)}
                      component={Link}
                      style={{ cursor: "pointer" }}
                      to={getSpaceUrl(page?.space.slug)}
                      variant="light"
                    >
                      {page?.space.name}
                    </Badge>
                  </Table.Td>
                )}
                <Table.Td>
                  <Text
                    c="dimmed"
                    fw={500}
                    size="xs"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {formattedDate(page.createdAt)}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {hasNextPage && (
        <Button
          fullWidth
          loading={isFetchingNextPage}
          mb="xl"
          mt="sm"
          onClick={() => fetchNextPage()}
          variant="subtle"
        >
          {t("Load more")}
        </Button>
      )}
    </>
  ) : (
    <EmptyState
      description={t("Pages you create will show up here.")}
      icon={IconFiles}
      title={t("No pages yet")}
    />
  );
}
