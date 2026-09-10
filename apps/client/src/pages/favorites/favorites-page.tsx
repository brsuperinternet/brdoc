import {
  Badge,
  Button,
  Container,
  Group,
  Table,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconFileDescription, IconStar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import rowClasses from "@/components/ui/clickable-table-row.module.css";
import { EmptyState } from "@/components/ui/empty-state";
import PageListSkeleton from "@/components/ui/page-list-skeleton";
import { useFavoritesQuery } from "@/features/favorite/queries/favorite-query";
import { buildPageUrl, getPageTitle } from "@/features/page/page.utils";
import { getSpaceUrl } from "@/lib/config";
import { getInitialsColor } from "@/lib/get-initials-color";
import { formattedDate } from "@/lib/time";

export default function FavoritesPage() {
  const { t } = useTranslation();
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useFavoritesQuery("page");
  const favorites = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <Container py="xl" size={800}>
        <Title mb="lg" order={3}>
          {t("Favorites")}
        </Title>
        <PageListSkeleton />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container py="xl" size={800}>
        <Title mb="lg" order={3}>
          {t("Favorites")}
        </Title>
        <Text>{t("Failed to fetch favorite pages")}</Text>
      </Container>
    );
  }

  return (
    <Container py="xl" size={800}>
      <Title mb="lg" order={1} size="h3">
        {t("Favorites")}
      </Title>
      {favorites.length > 0 ? (
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
                            {fav.page.icon || (
                              <ThemeIcon
                                color="gray"
                                size={18}
                                variant="transparent"
                              >
                                <IconFileDescription size={18} />
                              </ThemeIcon>
                            )}
                            <Text fw={500} lineClamp={1} size="md">
                              {getPageTitle(fav.page.title, undefined, t)}
                            </Text>
                          </Group>
                        </UnstyledButton>
                      </Table.Td>
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
          description={t("Pages you favorite will show up here.")}
          icon={IconStar}
          title={t("No favorite pages")}
        />
      )}
    </Container>
  );
}
