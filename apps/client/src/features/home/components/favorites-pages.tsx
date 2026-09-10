import {
  Badge,
  Button,
  Group,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconStar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageListIcon } from "@/components/common/page-list-icon";
import rowClasses from "@/components/ui/clickable-table-row.module.css";
import { EmptyState } from "@/components/ui/empty-state";
import PageListSkeleton from "@/components/ui/page-list-skeleton";
import { useFavoritesQuery } from "@/features/favorite/queries/favorite-query";
import { buildPageUrl, getPageTitle } from "@/features/page/page.utils";
import { getSpaceUrl } from "@/lib/config";
import { getInitialsColor } from "@/lib/get-initials-color";
import { formattedDate } from "@/lib/time";

interface Props {
  spaceId?: string;
}

export default function FavoritesPages({ spaceId }: Props) {
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useFavoritesQuery("page", spaceId);

  const favorites = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return <PageListSkeleton />;
  }

  if (isError) {
    return <Text>{t("Failed to fetch starred pages")}</Text>;
  }

  return favorites.length > 0 ? (
    <>
      <Table.ScrollContainer minWidth={500}>
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Tbody>
            {favorites.map((fav) =>
              fav.page ? (
                <Table.Tr className={rowClasses.row} key={fav.id}>
                  <Table.Td>
                    <UnstyledButton
                      className={rowClasses.link}
                      component={Link}
                      to={buildPageUrl(
                        fav.space?.slug,
                        fav.page.slugId,
                        fav.page.title
                      )}
                    >
                      <Group wrap="nowrap">
                        <PageListIcon
                          icon={fav.page.icon}
                          isBase={fav.page.isBase}
                        />
                        <Text fw={500} lineClamp={1} size="md">
                          {getPageTitle(fav.page.title, fav.page.isBase, t)}
                        </Text>
                      </Group>
                    </UnstyledButton>
                  </Table.Td>
                  {!spaceId && (
                    <Table.Td>
                      {fav.space && (
                        <Badge
                          color={getInitialsColor(fav.space.name)}
                          component={Link}
                          style={{ cursor: "pointer" }}
                          to={getSpaceUrl(fav.space.slug)}
                          variant="light"
                        >
                          {fav.space.name}
                        </Badge>
                      )}
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Text
                      c="dimmed"
                      fw={500}
                      size="xs"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {formattedDate(new Date(fav.createdAt))}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : null
            )}
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
      description={t("Pages you star will show up here.")}
      icon={IconStar}
      title={t("No favorites yet")}
    />
  );
}
