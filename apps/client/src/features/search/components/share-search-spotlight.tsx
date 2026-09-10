import { Center, Group, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { Spotlight } from "@mantine/spotlight";
import { IconSearch } from "@tabler/icons-react";
import DOMPurify from "dompurify";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buildSharedPageUrl } from "@/features/page/page.utils.ts";
import { shareSearchSpotlightStore } from "@/features/search/constants.ts";
import { useShareSearchQuery } from "@/features/search/queries/search-query";
import { getPageIcon } from "@/lib";

interface ShareSearchSpotlightProps {
  shareId?: string;
}
export function ShareSearchSpotlight({ shareId }: ShareSearchSpotlightProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedSearchQuery] = useDebouncedValue(query, 300);

  const { data: searchResults } = useShareSearchQuery({
    query: debouncedSearchQuery,
    shareId,
  });

  const pages = (
    searchResults && searchResults.length > 0 ? searchResults : []
  ).map((page) => (
    <Spotlight.Action
      component={Link}
      key={page.id}
      style={{ userSelect: "none" }}
      //@ts-expect-error
      to={buildSharedPageUrl({
        pageSlugId: page.slugId,
        pageTitle: page.title,
        shareId,
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
        store={shareSearchSpotlightStore}
      >
        <Spotlight.Search
          aria-label={t("Search")}
          leftSection={<IconSearch size={20} stroke={1.5} />}
          placeholder={t("Search...")}
        />
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
