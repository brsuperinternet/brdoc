import {
  ActionIcon,
  CloseButton,
  Group,
  Paper,
  ScrollArea,
  Switch,
  Text,
} from "@mantine/core";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  activeHistoryIdAtom,
  activeHistoryPrevIdAtom,
  comparePairAtom,
  diffCountsAtom,
  highlightChangesAtom,
} from "@/features/page-history/atoms/history-atoms";
import HistoryList from "@/features/page-history/components/history-list";
import HistoryView from "@/features/page-history/components/history-view";
import {
  useDiffNavigation,
  useHistoryReset,
} from "@/features/page-history/hooks";
import { usePageHistoryListQuery } from "@/features/page-history/queries/page-history-query";
import { formattedDate } from "@/lib/time";
import classes from "./css/history.module.css";

interface Props {
  pageId: string;
}

export default function HistoryModalBody({ pageId }: Props) {
  const { t } = useTranslation();
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const activeHistoryId = useAtomValue(activeHistoryIdAtom);
  const activeHistoryPrevId = useAtomValue(activeHistoryPrevIdAtom);
  const [highlightChanges, setHighlightChanges] = useAtom(highlightChangesAtom);
  const diffCounts = useAtomValue(diffCountsAtom);
  const [comparePair, setComparePair] = useAtom(comparePairAtom);

  const { data: pageHistoryData } = usePageHistoryListQuery(pageId);
  const historyItems = useMemo(
    () => pageHistoryData?.pages.flatMap((page) => page.items) ?? [],
    [pageHistoryData]
  );

  const compareLabel = useMemo(() => {
    if (!comparePair) {
      return null;
    }
    const newerItem = historyItems.find(
      (item) => item.id === comparePair.newerId
    );
    const olderItem = historyItems.find(
      (item) => item.id === comparePair.olderId
    );
    if (!(newerItem && olderItem)) {
      return null;
    }
    return t("Comparing {{newer}} and {{older}}", {
      newer: formattedDate(new Date(newerItem.createdAt)),
      older: formattedDate(new Date(olderItem.createdAt)),
    });
  }, [comparePair, historyItems, t]);

  useHistoryReset(pageId);
  const { currentChangeIndex, handlePrevChange, handleNextChange } =
    useDiffNavigation(scrollViewportRef);

  return (
    <div className={classes.sidebarFlex}>
      <nav className={classes.sidebar}>
        <div className={classes.sidebarMain}>
          <HistoryList pageId={pageId} />
        </div>
      </nav>

      <div style={{ flex: 1, position: "relative" }}>
        {comparePair && (
          <Group
            className={classes.compareBanner}
            justify="space-between"
            px="md"
            py={4}
            wrap="nowrap"
          >
            <Text fw={500} lineClamp={1} size="sm">
              {compareLabel ?? t("Compare versions")}
            </Text>
            <CloseButton
              aria-label={t("Exit compare")}
              onClick={() => setComparePair(null)}
              size="sm"
            />
          </Group>
        )}

        <ScrollArea
          h={650}
          scrollbarSize={5}
          viewportRef={scrollViewportRef}
          w="100%"
        >
          <div className={classes.sidebarRightSection}>
            {comparePair ? (
              <HistoryView
                historyId={comparePair.newerId}
                prevHistoryId={comparePair.olderId}
              />
            ) : (
              activeHistoryId && <HistoryView />
            )}
          </div>
        </ScrollArea>

        {(comparePair || (activeHistoryId && activeHistoryPrevId)) && (
          <Paper
            px="md"
            py="xs"
            radius="xl"
            shadow="md"
            style={{
              bottom: 16,
              left: "50%",
              position: "absolute",
              transform: "translateX(-50%)",
            }}
          >
            <Group gap="md" wrap="nowrap">
              <Switch
                checked={highlightChanges}
                label={t("Highlight changes")}
                onChange={(e) => setHighlightChanges(e.currentTarget.checked)}
                styles={{ label: { userSelect: "none", whiteSpace: "nowrap" } }}
              />
              {highlightChanges && diffCounts && diffCounts.total > 0 && (
                <Group gap="xs" wrap="nowrap">
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
      </div>
    </div>
  );
}
