import { Button, Center, Group, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { Spotlight } from "@mantine/spotlight";
import { IconLetterCase, IconSearch } from "@tabler/icons-react";
import DOMPurify from "dompurify";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buildPublicSpaceUrl } from "@/features/page/page.utils.ts";
import { publicSpaceSearchSpotlightStore } from "@/features/search/constants.ts";
import { usePublicSpaceSearchQuery } from "@/features/search/queries/search-query";
import { getPageIcon } from "@/lib";

interface PublicSpaceSearchSpotlightProps {
  spaceSlug: string;
}
export function PublicSpaceSearchSpotlight({
  spaceSlug,
}: PublicSpaceSearchSpotlightProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [titleOnly, setTitleOnly] = useState(false);
  const [debouncedSearchQuery] = useDebouncedValue(query, 300);

  const { data: searchResults } = usePublicSpaceSearchQuery({
    query: debouncedSearchQuery,
    spaceSlug,
    ...(titleOnly && { titleOnly: true }),
  });

  const pages = (
    searchResults && searchResults.length > 0 ? searchResults : []
  ).map((page) => (
    <Spotlight.Action
      component={Link}
      key={page.id}
      style={{ userSelect: "none" }}
      //@ts-expect-error
      to={buildPublicSpaceUrl({
        pageSlugId: page.slugId,
        pageTitle: page.title,
        spaceSlug,
      })}
    >
      <Group w="100%" wrap="nowrap">
        <Center>{getPageIcon(page?.icon)}</Center>

        <div style={{ flex: 1 }}>
          <Text>{page.title}</Text>

          {page?.highlight && (
            <Text
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(page.highlight, {
                  ALLOWED_ATTR: [],
                  ALLOWED_TAGS: ["mark", "em", "strong", "b"],
                }),
              }}
              opacity={0.6}
              size="xs"
            />
          )}
        </div>
      </Group>
    </Spotlight.Action>
  ));

  return (
    <>
      <Spotlight.Root
        onQueryChange={setQuery}
        overlayProps={{
          backgroundOpacity: 0.55,
        }}
        query={query}
        scrollable
        store={publicSpaceSearchSpotlightStore}
      >
        <Spotlight.Search
          aria-label={t("Search")}
          leftSection={<IconSearch size={20} stroke={1.5} />}
          placeholder={t("Search...")}
        />
        <Group px="sm" py={6}>
          <Button
            aria-pressed={titleOnly}
            color={titleOnly ? undefined : "gray"}
            fw={500}
            leftSection={<IconLetterCase size={15} />}
            onClick={() => setTitleOnly((value) => !value)}
            radius="xl"
            size="compact-sm"
            variant={titleOnly ? "light" : "subtle"}
          >
            {t("Title only")}
          </Button>
        </Group>
        <Spotlight.ActionsList>
          {query.length === 0 && pages.length === 0 && (
            <Spotlight.Empty>{t("Start typing to search...")}</Spotlight.Empty>
          )}

          {query.length > 0 && pages.length === 0 && (
            <Spotlight.Empty>{t("No results found...")}</Spotlight.Empty>
          )}

          {pages.length > 0 && pages}
        </Spotlight.ActionsList>
      </Spotlight.Root>
    </>
  );
}
