import { Button, Group, Text, VisuallyHidden } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { Spotlight } from "@mantine/spotlight";
import { IconSearch, IconSparkles } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { hintVectorCache } from "@/ee/ai/services/ai-search-service.ts";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { getAiVectorDriver } from "@/lib/config.ts";
import { AiSearchResult } from "../../../ee/ai/components/ai-search-result.tsx";
import { useAiSearch } from "../../../ee/ai/hooks/use-ai-search.ts";
import { searchSpotlightStore } from "../constants.ts";
import { useUnifiedSearch } from "../hooks/use-unified-search.ts";
import { SearchResultItem } from "./search-result-item.tsx";
import { SearchSpotlightFilters } from "./search-spotlight-filters.tsx";

interface SearchSpotlightProps {
  spaceId?: string;
}
export function SearchSpotlight({ spaceId }: SearchSpotlightProps) {
  const workspace = useAtomValue(workspaceAtom);
  const { t } = useTranslation();
  const hasAiFeature = useHasFeature(Feature.AI);
  const hasAttachmentIndexing = useHasFeature(Feature.ATTACHMENT_INDEXING);
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
  const [isAiMode, setIsAiMode] = useState(false);

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

  const { data: searchResults, isFetching } = useUnifiedSearch(
    searchParams,
    !isAiMode // Disable regular search when in AI mode
  );
  const {
    //@ts-expect-error
    data: aiSearchResult,
    //@ts-expect-error
    isPending: isAiLoading,
    //@ts-expect-error
    mutate: triggerAiSearchMutation,
    //@ts-expect-error
    reset: resetAiMutation,
    //@ts-expect-error
    error: aiSearchError,
    streamingAnswer,
    streamingSources,
    clearStreaming,
  } = useAiSearch();

  // Clear streaming state and mutation data when query changes (user is typing a new query)
  useEffect(() => {
    clearStreaming();
    resetAiMutation();
  }, [query, clearStreaming, resetAiMutation]);

  // Show error notification when AI search fails
  useEffect(() => {
    if (aiSearchError) {
      notifications.show({
        color: "red",
        message:
          aiSearchError.message || t("AI search failed. Please try again."),
        position: "top-center",
      });
    }
  }, [aiSearchError, t]);

  const isFilterBrowse =
    (filters.labelIds?.length ?? 0) > 0 || !!filters.creatorId;
  // while the debounce is pending the empty list is not a settled "no results"
  const isQuerySettled = query === debouncedSearchQuery;

  // Determine result type for rendering
  const isAttachmentSearch =
    filters.contentType === "attachment" && hasAttachmentIndexing;

  const resultItems = (searchResults || []).map((result) => (
    <SearchResultItem
      isAttachmentResult={isAttachmentSearch}
      key={result.id}
      result={result}
      showSpace={!filters.spaceId}
    />
  ));

  const handleSpotlightOpen = () => {
    if (
      workspace?.settings?.ai?.search === true &&
      getAiVectorDriver() === "turbopuffer"
    ) {
      hintVectorCache();
    }
  };

  const handleFiltersChange = useCallback(
    (newFilters: any) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  const handleAskClick = () => {
    setIsAiMode(!isAiMode);
  };

  const handleAiSearchTrigger = () => {
    if (query.trim() && isAiMode) {
      triggerAiSearchMutation(searchParams);
    }
  };

  return (
    <>
      <Spotlight.Root
        maxHeight={600}
        onQueryChange={setQuery}
        onSpotlightOpen={handleSpotlightOpen}
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
            aria-label={isAiMode ? t("Ask a question...") : t("Search")}
            leftSection={<IconSearch size={20} stroke={1.5} />}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                isAiMode &&
                query.trim() &&
                !isAiLoading
              ) {
                e.preventDefault();
                handleAiSearchTrigger();
              }
            }}
            placeholder={isAiMode ? t("Ask a question...") : t("Search...")}
            style={{ flex: 1 }}
          />
          {isAiMode && hasAiFeature && (
            <Button
              disabled={!query.trim()}
              leftSection={<IconSparkles size={16} />}
              loading={isAiLoading}
              onClick={handleAiSearchTrigger}
              size="xs"
            >
              Ask
            </Button>
          )}
        </Group>

        <div
          style={{
            padding: "4px 16px",
          }}
        >
          <SearchSpotlightFilters
            isAiMode={isAiMode}
            onAskClick={handleAskClick}
            onFiltersChange={handleFiltersChange}
            spaceId={spaceId}
          />
        </div>

        <VisuallyHidden aria-live="polite" role="status">
          {isAiMode
            ? query.length > 0 && !isAiLoading && !aiSearchResult
              ? t("No answer available")
              : ""
            : (query.length > 0 || isFilterBrowse) && !isFetching
              ? resultItems.length === 0
                ? t("No results found")
                : t("{{count}} results found", { count: resultItems.length })
              : ""}
        </VisuallyHidden>

        <Spotlight.ActionsList>
          {isAiMode ? (
            <>
              {query.length === 0 && (
                <Spotlight.Empty>{t("Ask a question...")}</Spotlight.Empty>
              )}
              {query.length > 0 &&
                (isAiLoading || aiSearchResult || streamingAnswer) && (
                  <AiSearchResult
                    isLoading={isAiLoading}
                    result={aiSearchResult}
                    streamingAnswer={streamingAnswer}
                    streamingSources={streamingSources}
                  />
                )}
              {query.length > 0 && !isAiLoading && !aiSearchResult && (
                <Spotlight.Empty>{t("No answer available")}</Spotlight.Empty>
              )}
            </>
          ) : (
            <>
              {query.length === 0 &&
                !isFilterBrowse &&
                resultItems.length === 0 && (
                  <Spotlight.Empty>
                    {t("Start typing to search...")}
                  </Spotlight.Empty>
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
            </>
          )}
        </Spotlight.ActionsList>
      </Spotlight.Root>
    </>
  );
}
