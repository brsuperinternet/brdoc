import { ActionIcon, Loader, ScrollArea, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconFileDescription, IconSearch } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { IPage } from "@/features/page/types/page.types";
import { useSearchSuggestionsQuery } from "@/features/search/queries/search-query";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";
import { ISpace } from "@/features/space/types/space.types";
import classes from "./destination-picker.module.css";
import { DestinationSelection } from "./destination-picker.types";
import { SpaceRow } from "./space-row";

type DestinationPickerProps = {
  onSelectionChange: (selection: DestinationSelection | null) => void;
  excludePageId?: string;
  pageLimit?: number;
  initialSpaceId?: string;
  searchSpacesOnly?: boolean;
};

export function DestinationPicker({
  onSelectionChange,
  excludePageId,
  pageLimit = 15,
  initialSpaceId,
  searchSpacesOnly,
}: DestinationPickerProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selection, setSelection] = useState<DestinationSelection | null>(null);
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);
  const viewportRef = useRef<HTMLDivElement>(null);

  const { data: spacesData, isLoading: spacesLoading } = useGetSpacesQuery({
    limit: 100,
  });

  const searchEnabled =
    !searchSpacesOnly && debouncedQuery && debouncedQuery.length >= 2;

  const { data: searchData, isLoading: searchLoading } =
    useSearchSuggestionsQuery({
      includePages: true,
      limit: 20,
      query: searchEnabled ? debouncedQuery : "",
    });

  const isSearching = !!searchEnabled;

  const filteredSpaces = useMemo(() => {
    const items = spacesData?.items ?? [];
    if (!(searchSpacesOnly && debouncedQuery)) {
      return items;
    }
    const fold = (s: string) =>
      s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase();
    const term = fold(debouncedQuery);
    return items.filter((s) => fold(s.name).includes(term));
  }, [spacesData, searchSpacesOnly, debouncedQuery]);

  const selectedId =
    selection?.type === "space"
      ? selection.spaceId
      : (selection?.pageId ?? null);

  const updateSelection = useCallback(
    (next: DestinationSelection | null) => {
      setSelection(next);
      onSelectionChange(next);
    },
    [onSelectionChange]
  );

  const handleSearchResultClick = (page: Partial<IPage>) => {
    if (!(page.space && page.id)) {
      return;
    }

    updateSelection({
      page,
      pageId: page.id,
      space: page.space,
      spaceId: page.space.id,
      type: "page",
    });
    setSearchQuery("");
  };

  const handleSelectSpace = useCallback(
    (space: ISpace) => {
      updateSelection({ space, spaceId: space.id, type: "space" });
    },
    [updateSelection]
  );

  const handleSelectPage = useCallback(
    (page: Partial<IPage>, space: ISpace) => {
      if (!page.id) {
        return;
      }
      updateSelection({
        page,
        pageId: page.id,
        space,
        spaceId: page.spaceId ?? space.id,
        type: "page",
      });
    },
    [updateSelection]
  );

  // Pre-select space when initialSpaceId is set and spaces have loaded.
  // Only runs once: skip if user has already made a selection.
  useEffect(() => {
    if (!initialSpaceId || selection) {
      return;
    }
    const match = spacesData?.items?.find((s) => s.id === initialSpaceId);
    if (match) {
      updateSelection({ space: match, spaceId: match.id, type: "space" });
      requestAnimationFrame(() => {
        const el = viewportRef.current?.querySelector<HTMLElement>(
          `[data-space-id="${match.id}"]`
        );
        el?.scrollIntoView({ block: "nearest" });
      });
    }
  }, [initialSpaceId, selection, spacesData, updateSelection]);

  return (
    <>
      <TextInput
        aria-label={
          searchSpacesOnly
            ? t("Search spaces...")
            : t("Search pages and spaces...")
        }
        className={classes.searchInput}
        leftSection={<IconSearch size={16} />}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        placeholder={
          searchSpacesOnly
            ? t("Search spaces...")
            : t("Search pages and spaces...")
        }
        value={searchQuery}
        variant="filled"
      />

      <ScrollArea
        className={classes.scrollArea}
        h="50vh"
        offsetScrollbars
        viewportRef={viewportRef}
      >
        {isSearching ? (
          searchLoading ? (
            <div className={classes.emptyState}>
              <Loader size="xs" />
            </div>
          ) : searchData?.pages && searchData.pages.length > 0 ? (
            searchData.pages.map(
              (page) =>
                page && (
                  <div
                    className={classes.searchResult}
                    key={page.id}
                    onClick={() => handleSearchResultClick(page)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSearchResultClick(page);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={classes.iconWrapper}>
                      {page.icon ? (
                        page.icon
                      ) : (
                        <ActionIcon
                          c="gray"
                          component="div"
                          size={22}
                          variant="transparent"
                        >
                          <IconFileDescription size={18} />
                        </ActionIcon>
                      )}
                    </div>
                    <div className={classes.pageTitle}>
                      {page.title || t("Untitled")}
                    </div>
                    {page.space && (
                      <div className={classes.spaceName}>{page.space.name}</div>
                    )}
                  </div>
                )
            )
          ) : (
            <div className={classes.emptyState}>{t("No results found")}</div>
          )
        ) : spacesLoading ? (
          <div className={classes.emptyState}>
            <Loader size="xs" />
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className={classes.emptyState}>
            {searchSpacesOnly && debouncedQuery
              ? t("No spaces found")
              : t("No results found")}
          </div>
        ) : (
          filteredSpaces.map((space) => (
            <SpaceRow
              excludePageId={excludePageId}
              key={space.id}
              limit={pageLimit}
              onSelectPage={handleSelectPage}
              onSelectSpace={handleSelectSpace}
              selectedId={selectedId}
              space={space}
            />
          ))
        )}
      </ScrollArea>
    </>
  );
}
