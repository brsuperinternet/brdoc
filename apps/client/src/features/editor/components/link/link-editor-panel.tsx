import {
  Group,
  ScrollArea,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconFileDescription, IconLink, IconWorld } from "@tabler/icons-react";
import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { AutoTooltipText } from "@/components/ui/auto-tooltip-text.tsx";
import { LinkEditorPanelProps } from "@/features/editor/components/link/types.ts";
import { useLinkEditorState } from "@/features/editor/components/link/use-link-editor-state.tsx";
import { buildPageUrl, getPageTitle } from "@/features/page/page.utils.ts";
import { IPage } from "@/features/page/types/page.types.ts";
import { useSearchSuggestionsQuery } from "@/features/search/queries/search-query.ts";
import { useSpaceQuery } from "@/features/space/queries/space-query.ts";
import classes from "./link.module.css";

export const LinkEditorPanel = ({
  onSetLink,
  initialUrl,
  onUnsetLink,
}: LinkEditorPanelProps) => {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const { data: space } = useSpaceQuery(spaceSlug);
  const state = useLinkEditorState({ initialUrl, onSetLink });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const { data: suggestion } = useSearchSuggestionsQuery({
    includePages: true,
    includeUsers: false,
    limit: state.isSearchQuery ? 10 : 3,
    preload: true,
    query: state.isSearchQuery ? state.url : "",
    spaceId: space?.id,
  });

  const pages: Partial<IPage>[] = suggestion?.pages ?? [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [pages.length]);

  const selectPage = useCallback(
    (page: Partial<IPage>) => {
      const url = buildPageUrl(
        page.space?.slug || spaceSlug,
        page.slugId,
        page.title
      );
      onSetLink(url, true);
    },
    [onSetLink, spaceSlug]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const hasUrlItem =
        state.url.length > 0 && (state.isValidUrl || state.isSearchQuery);
      const total =
        (hasUrlItem ? 1 : 0) + (state.isValidUrl ? 0 : pages.length);
      if (total === 0) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, total - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (hasUrlItem && selectedIndex === 0) {
          onSetLink(state.url, false);
        } else {
          const pageIndex = hasUrlItem ? selectedIndex - 1 : selectedIndex;
          if (pageIndex >= 0 && pageIndex < pages.length) {
            selectPage(pages[pageIndex]);
          }
        }
      }
    },
    [
      pages,
      selectedIndex,
      selectPage,
      state.isValidUrl,
      state.isSearchQuery,
      state.url,
      onSetLink,
    ]
  );

  useEffect(() => {
    viewportRef.current
      ?.querySelector(`[data-item-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const showPages = pages.length > 0 && !state.isValidUrl;
  const showUrlItem =
    state.url.length > 0 && (state.isValidUrl || state.isSearchQuery);
  const showDropdown = showPages || showUrlItem;

  return (
    <div>
      <form onSubmit={state.handleSubmit}>
        <TextInput
          aria-activedescendant={
            showDropdown ? `link-editor-option-${selectedIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-controls="link-editor-results"
          aria-expanded={showDropdown}
          aria-label={t("Paste link or search pages")}
          autoFocus
          classNames={{ input: classes.linkInput }}
          data-autofocus
          leftSection={
            <IconLink
              color="var(--mantine-color-dimmed)"
              size={16}
              stroke={1.5}
            />
          }
          onChange={state.onChange}
          onKeyDown={handleKeyDown}
          placeholder={t("Paste link or search pages")}
          role="combobox"
          value={state.url}
        />
      </form>

      {showDropdown && (
        <>
          {!(state.isSearchQuery || state.isValidUrl) && (
            <Text c="dimmed" fw={600} pb={4} pt={10} px="sm" size="xs">
              {t("Recents")}
            </Text>
          )}

          <ScrollArea.Autosize
            aria-label={t("Link suggestions")}
            id="link-editor-results"
            mah={300}
            mt={state.url.length > 0 ? 8 : 0}
            role="listbox"
            scrollbarSize={6}
            scrollbars="y"
            styles={{ content: { minWidth: 0 } }}
            viewportRef={viewportRef}
          >
            {showUrlItem && (
              <UnstyledButton
                aria-selected={selectedIndex === 0}
                className={clsx(classes.searchItem, {
                  [classes.selectedSearchItem]: selectedIndex === 0,
                })}
                data-item-index={0}
                id="link-editor-option-0"
                onClick={() => onSetLink(state.url, false)}
                role="option"
              >
                <Group align="flex-start" gap={10} wrap="nowrap">
                  <span className={classes.pageIcon}>
                    <IconWorld size={18} stroke={1.5} />
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={500} lh={1.3} size="sm" truncate>
                      {state.url}
                    </Text>
                    <Text c="dimmed" lh={1.4} size="xs">
                      {t("Link to web page")}
                    </Text>
                  </div>
                </Group>
              </UnstyledButton>
            )}

            {!state.isValidUrl &&
              pages.map((page, index) => {
                const itemIndex = showUrlItem ? index + 1 : index;
                return (
                  <UnstyledButton
                    aria-selected={itemIndex === selectedIndex}
                    className={clsx(classes.searchItem, {
                      [classes.selectedSearchItem]: itemIndex === selectedIndex,
                    })}
                    data-item-index={itemIndex}
                    id={`link-editor-option-${itemIndex}`}
                    key={page.id || index}
                    onClick={() => selectPage(page)}
                    role="option"
                  >
                    <Group align="flex-start" gap={10} wrap="nowrap">
                      <span className={classes.pageIcon}>
                        {page.icon || (
                          <IconFileDescription size={18} stroke={1.5} />
                        )}
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <AutoTooltipText fw={500} lh={1.3} size="sm" truncate>
                          {getPageTitle(page.title, page.isBase, t)}
                        </AutoTooltipText>
                        {page.space?.name && (
                          <AutoTooltipText
                            c="dimmed"
                            lh={1.4}
                            size="xs"
                            truncate
                          >
                            {page.space.name}
                          </AutoTooltipText>
                        )}
                      </div>
                    </Group>
                  </UnstyledButton>
                );
              })}
          </ScrollArea.Autosize>
        </>
      )}

      {onUnsetLink && (
        <UnstyledButton className={classes.removeLink} onClick={onUnsetLink}>
          <Text c="red" size="sm">
            {t("Remove link")}
          </Text>
        </UnstyledButton>
      )}
    </div>
  );
};
