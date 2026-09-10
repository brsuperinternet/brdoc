import { Box, Container, Group, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import CreateSpaceModal from "@/features/space/components/create-space-modal";
import { AllSpacesList } from "@/features/space/components/spaces-page";
import FavoriteSpacesGrid from "@/features/space/components/spaces-page/favorite-spaces-grid";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";
import { usePaginateAndSearch } from "@/hooks/use-paginate-and-search";
import useUserRole from "@/hooks/use-user-role";

export default function Spaces() {
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();
  const { search, cursor, goNext, goPrev, handleSearch } =
    usePaginateAndSearch();

  const { data, isLoading } = useGetSpacesQuery({
    cursor,
    limit: 30,
    query: search,
  });

  return (
    <>
      <DocumentTitle title={t("Spaces")} />

      <Container pt="xl" size={"800"}>
        <Group justify="space-between" mb="xl">
          <Title order={1} size="h3">
            {t("Spaces")}
          </Title>
          {isAdmin && <CreateSpaceModal />}
        </Group>

        <FavoriteSpacesGrid />

        <Box>
          <Text c="dimmed" mb="md" size="sm">
            {t("All spaces")}
          </Text>

          <AllSpacesList
            hasNextPage={data?.meta?.hasNextPage}
            hasPrevPage={data?.meta?.hasPrevPage}
            onNext={() => goNext(data?.meta?.nextCursor)}
            onPrev={goPrev}
            onSearch={handleSearch}
            spaces={data?.items || []}
          />
        </Box>
      </Container>
    </>
  );
}
