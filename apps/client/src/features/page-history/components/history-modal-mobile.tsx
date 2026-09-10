import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Select,
  Switch,
  Text,
} from "@mantine/core";
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  activeHistoryIdAtom,
  activeHistoryPrevIdAtom,
  diffCountsAtom,
  highlightChangesAtom,
  historyAtoms,
} from "@/features/page-history/atoms/history-atoms";
import HistoryView from "@/features/page-history/components/history-view";
import {
  useDiffNavigation,
  useHistoryReset,
  useHistoryRestore,
} from "@/features/page-history/hooks";
import { usePageHistoryListQuery } from "@/features/page-history/queries/page-history-query";
import { formattedDate } from "@/lib/time";
import classes from "./css/history-mobile.module.css";

interface Props {
  pageId: string;
  pageTitle?: string;
}

export default function HistoryModalMobile({ pageId, pageTitle }: Props) {
  const { t } = useTranslation();

  const [activeHistoryId, setActiveHistoryId] = useAtom(activeHistoryIdAtom);
  const setActiveHistoryPrevId = useSetAtom(activeHistoryPrevIdAtom);
  const [highlightChanges, setHighlightChanges] = useAtom(highlightChangesAtom);
  const diffCounts = useAtomValue(diffCountsAtom);
  const setHistoryModalOpen = useSetAtom(historyAtoms);

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const dropdownViewportRef = useRef<HTMLDivElement>(null);

  const {
    data: pageHistoryData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePageHistoryListQuery(pageId);

  const historyItems = useMemo(
    () => pageHistoryData?.pages.flatMap((page) => page.items) ?? [],
    [pageHistoryData]
  );

  const selectData = useMemo(
    () =>
      historyItems.map((item) => {
        const contributors = item.contributors;
        const hasContributors = contributors && contributors.length > 0;
        const names = hasContributors
          ? contributors.map((c) => c.name).join(", ")
          : item.lastUpdatedBy?.name;
        return {
          label: formattedDate(new Date(item.createdAt)),
          userName: names,
          value: item.id,
        };
      }),
    [historyItems]
  );

  useHistoryReset(pageId);
  const { canRestore, confirmRestore } = useHistoryRestore();
  const { currentChangeIndex, handlePrevChange, handleNextChange } =
    useDiffNavigation(scrollViewportRef);

  useEffect(() => {
    if (historyItems.length > 0 && !activeHistoryId) {
      setActiveHistoryId(historyItems[0].id);
      setActiveHistoryPrevId(historyItems[1]?.id ?? "");
    }
  }, [
    historyItems,
    activeHistoryId,
    setActiveHistoryId,
    setActiveHistoryPrevId,
  ]);

  const handleDropdownScroll = useCallback(() => {
    const viewport = dropdownViewportRef.current;
    if (!(viewport && hasNextPage) || isFetchingNextPage) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;

    if (isNearBottom) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSelectVersion = useCallback(
    (value: string | null) => {
      if (!value) {
        return;
      }
      const index = historyItems.findIndex((item) => item.id === value);
      if (index >= 0) {
        setActiveHistoryId(value);
        setActiveHistoryPrevId(historyItems[index + 1]?.id ?? "");
      }
    },
    [historyItems, setActiveHistoryId, setActiveHistoryPrevId]
  );

  if (isLoading) {
    return null;
  }

  return (
    <Box className={classes.container}>
      <Box className={classes.selectorWrapper}>
        <Select
          checkIconPosition="right"
          comboboxProps={{ withinPortal: false }}
          data={selectData}
          maxDropdownHeight={300}
          onChange={handleSelectVersion}
          placeholder={t("Select version")}
          renderOption={({ option, checked }) => (
            <Group justify="space-between" w="100%" wrap="nowrap">
              <div>
                <Text size="sm">{option.label}</Text>
                <Text c="dimmed" size="xs">
                  {(option as { userName?: string }).userName}
                </Text>
              </div>
              {checked && <IconCheck size={16} />}
            </Group>
          )}
          scrollAreaProps={{
            onScrollPositionChange: handleDropdownScroll,
            viewportRef: dropdownViewportRef,
          }}
          value={activeHistoryId}
        />
      </Box>

      <ScrollArea
        className={classes.editorArea}
        scrollbarSize={5}
        viewportRef={scrollViewportRef}
      >
        <Box className={classes.editorContent}>
          {activeHistoryId && <HistoryView />}
        </Box>
      </ScrollArea>

      {canRestore && (
        <Group className={classes.actionButtons} gap="sm" justify="flex-end">
          <Button onClick={() => setHistoryModalOpen(false)} variant="default">
            {t("Cancel")}
          </Button>
          <Button onClick={() => confirmRestore()}>{t("Restore")}</Button>
        </Group>
      )}

      {activeHistoryId && (
        <Paper
          className={classes.floatingBar}
          px="md"
          py="xs"
          radius="xl"
          shadow="sm"
        >
          <Group gap="sm" wrap="nowrap">
            <Switch
              checked={highlightChanges}
              label={t("Highlight changes")}
              onChange={(e) => setHighlightChanges(e.currentTarget.checked)}
              size="sm"
              styles={{ label: { userSelect: "none", whiteSpace: "nowrap" } }}
            />
            {highlightChanges && diffCounts && diffCounts.total > 0 && (
              <Group gap={4} wrap="nowrap">
                <Text c="dimmed" size="sm" style={{ whiteSpace: "nowrap" }}>
                  {currentChangeIndex} of {diffCounts.total}
                </Text>
                <ActionIcon
                  onClick={handlePrevChange}
                  size="sm"
                  variant="subtle"
                >
                  <IconChevronUp size={16} />
                </ActionIcon>
                <ActionIcon
                  onClick={handleNextChange}
                  size="sm"
                  variant="subtle"
                >
                  <IconChevronDown size={16} />
                </ActionIcon>
              </Group>
            )}
          </Group>
        </Paper>
      )}
    </Box>
  );
}
