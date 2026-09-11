import { Group, Text, VisuallyHidden } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { Spotlight } from "@mantine/spotlight";
import { IconSearch } from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { searchSpotlightStore } from "../constants.ts";
import { useUnifiedSearch } from "../hooks/use-unified-search.ts";
import { SearchResultItem } from "./search-result-item.tsx";
import { SearchSpotlightFilters } from "./search-spotlight-filters.tsx";

interface SearchSpotlightProps {
  spaceId?: string;
}
export function SearchSpotlight({ spaceId }: SearchSpotlightProps) {
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [debouncedSearchQuery] = useDebouncedValue(query, 300);
  const [filters, setFilters] = useState<{
    spaceId?: string | null;
    contentType?: string;
    creatorId?: string | null;
    labelIds?: string[];
    titleOnly?: boolean;
  }>({
    contentType: "page",
  });

  // Build unified search params
  const searchParams = useMemo(() => {
    const params: any = {
      contentType: filters.contentType || "page", // Only used for frontend routing
      query: debouncedSearchQuery,
    };

    // Handle space filtering - only pass spaceId if a specific space is selected
    if (filters.spaceId) {
      params.spaceId = filters.spaceId;
    }

    if (filters.creatorId) {
      params.creatorId = filters.creatorId;
    }

    if (filters.labelIds?.length) {
      params.labelIds = filters.labelIds;
    }

    if (filters.titleOnly) {
      params.titleOnly = true;
    }

    return params;
  }, [debouncedSearchQuery, filters]);

  const { data: searchResults, isFetching } = useUnifiedSearch(searchParams);

  const isFilterBrowse =
    (filters.labelIds?.length ?? 0) > 0 || !!filters.creatorId;
  // while the debounce is pending the empty list is not a settled "no results"
  const isQuerySettled = query === debouncedSearchQuery;

  const resultItems = (searchResults || []).map((result) => (
    <SearchResultItem
      key={result.id}
      result={result}
      showSpace={!filters.spaceId}
    />
  ));

  const handleFiltersChange = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  return (
    <Spotlight.Root
      maxHeight={600}
      onQueryChange={setQuery}
      overlayProps={{
        backgroundOpacity: 0.55,
      }}
      query={query}
      scrollable
      size="xl"
      store={searchSpotlightStore}
    >
      <Group gap="xs" pb="xs" pt="sm" px="sm">
        <Spotlight.Search
          aria-label={t("Search")}
          leftSection={<IconSearch size={20} stroke={1.5} />}
          placeholder={t("Search")}
          style={{ flex: 1 }}
        />
      </Group>

      <div
        style={{
          padding: "4px 16px",
        }}
      >
        <SearchSpotlightFilters
          onFiltersChange={handleFiltersChange}
          spaceId={spaceId}
        />
      </div>

      <VisuallyHidden aria-live="polite" role="status">
        {(query.length > 0 || isFilterBrowse) && !isFetching
          ? resultItems.length === 0
            ? t("No results found")
            : t("{{count}} results found", { count: resultItems.length })
          : ""}
      </VisuallyHidden>

      <Spotlight.ActionsList>
        {query.length === 0 && !isFilterBrowse && resultItems.length === 0 && (
          <Spotlight.Empty>{t("Start typing to search...")}</Spotlight.Empty>
        )}

        {(query.length > 0 || isFilterBrowse) &&
          !isFetching &&
          isQuerySettled &&
          resultItems.length === 0 && (
            <Spotlight.Empty>{t("No results found...")}</Spotlight.Empty>
          )}

        {resultItems.length > 0 && <>{resultItems}</>}

        {(query.length > 0 || isFilterBrowse) &&
          isFetching &&
          resultItems.length === 0 && (
            <Spotlight.Empty>
              <Text size="sm" style={{ marginTop: 10 }}>
                {t("Searching...")}
              </Text>
            </Spotlight.Empty>
          )}
      </Spotlight.ActionsList>
    </Spotlight.Root>
  );
}
