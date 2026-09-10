import { Loader, Paper, ScrollArea, Text, UnstyledButton } from "@mantine/core";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import classes from "./emoji-menu.module.css";
import { EmojiMenuItemType } from "./types";
import {
  EmojiCategory,
  EmojiIndexEntry,
  getEmojiCategories,
  incrementEmojiUsage,
} from "./utils";

const COLS = 8;

const CAT_ICONS: Record<string, string> = {
  activity: "🎮",
  flags: "🚩",
  foods: "🍕",
  nature: "🌿",
  objects: "🔧",
  people: "😀",
  places: "🗺️",
  symbols: "💯",
};

function EmojiList({
  items,
  isLoading,
  command,
  editor,
  range,
  query = "",
}: {
  items: EmojiMenuItemType[];
  isLoading: boolean;
  command: (item: EmojiMenuItemType) => void;
  editor: any;
  range: any;
  query?: string;
}) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const [cats, setCats] = useState<EmojiCategory[]>([]);
  const [activeCat, setActiveCat] = useState("");
  const [focusZone, setFocusZone] = useState<"grid" | "tabs">("grid");
  const [announce, setAnnounce] = useState("");
  const listViewport = useRef<HTMLDivElement>(null);
  const gridViewport = useRef<HTMLDivElement>(null);
  const catBar = useRef<HTMLDivElement>(null);
  const userInteractedRef = useRef(false);

  const searching = query.length > 0;
  const browseLoading = !searching && cats.length === 0;
  const gridItems = cats.find((c) => c.id === activeCat)?.emojis ?? [];

  useEffect(() => {
    getEmojiCategories().then((data) => {
      setCats(data);
      setActiveCat((prev) => prev || data[0]?.id || "");
    });
  }, []);

  useEffect(() => {
    setIdx(0);
  }, [query, activeCat]);

  useEffect(() => {
    if (searching) {
      setFocusZone("grid");
    }
  }, [searching]);

  useEffect(() => {
    if (focusZone !== "tabs") {
      return;
    }
    catBar.current
      ?.querySelector<HTMLElement>(`[data-cat="${activeCat}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeCat, focusZone]);

  useEffect(() => {
    if (focusZone === "tabs") {
      return;
    }
    const vp = searching ? listViewport.current : gridViewport.current;
    vp?.querySelector<HTMLElement>(`[data-i="${idx}"]`)?.scrollIntoView({
      block: "nearest",
    });
  }, [idx, searching, focusZone]);

  // Announce picker open and selection changes via a live region. Focus
  // stays in the editor, so without this the screen reader has no way to
  // know the picker exists or that arrow keys are changing the selection.
  // The setTimeout defers the open message past the initial render so the
  // live region is in the DOM before its content changes (screen readers
  // ignore content that's present at mount time).
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnnounce(
        t("Emoji picker open. Use arrow keys to navigate, Enter to select.")
      );
    }, 100);
    return () => clearTimeout(timer);
  }, [t]);

  useEffect(() => {
    // Skip data-driven updates (idx reset, async cat load); only announce
    // selection changes that come from real user navigation.
    if (!userInteractedRef.current) {
      return;
    }

    if (focusZone === "tabs") {
      if (activeCat) {
        setAnnounce(t("{{name}} category", { name: activeCat }));
      }
      return;
    }
    if (searching) {
      const item = items[idx];
      if (item) {
        setAnnounce(
          t("{{name}}, {{n}} of {{total}}", {
            n: idx + 1,
            name: item.id,
            total: items.length,
          })
        );
      }
      return;
    }
    const entry = gridItems[idx];
    if (entry) {
      setAnnounce(
        t("{{name}}, {{n}} of {{total}}", {
          n: idx + 1,
          name: entry.id,
          total: gridItems.length,
        })
      );
    }
  }, [idx, activeCat, focusZone, searching, items, gridItems, t]);

  const pickSearchItem = useCallback(
    (i: number) => {
      const item = items[i];
      if (!item) {
        return;
      }
      command(item);
      incrementEmojiUsage(item.id);
    },
    [command, items]
  );

  const pickGridItem = useCallback(
    (entry: EmojiIndexEntry) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent(entry.native + " ")
        .run();
      incrementEmojiUsage(entry.id);
    },
    [editor, range]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(
          e.key
        )
      ) {
        userInteractedRef.current = true;
      }
      if (searching) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setIdx((i) => Math.min(i + 1, items.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
          e.preventDefault();
          pickSearchItem(idx);
        }
      } else if (focusZone === "tabs") {
        const catIdx = cats.findIndex((c) => c.id === activeCat);
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const next = cats[Math.min(catIdx + 1, cats.length - 1)];
          if (next) {
            setActiveCat(next.id);
          }
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          const prev = cats[Math.max(catIdx - 1, 0)];
          if (prev) {
            setActiveCat(prev.id);
          }
        } else if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault();
          setFocusZone("grid");
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
        }
      } else {
        const total = gridItems.length;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setIdx((i) => Math.min(i + 1, total - 1));
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setIdx((i) => Math.min(i + COLS, total - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (idx < COLS) {
            setFocusZone("tabs");
          } else {
            setIdx((i) => Math.max(i - COLS, 0));
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (gridItems[idx]) {
            pickGridItem(gridItems[idx]);
          }
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    searching,
    items,
    idx,
    gridItems,
    pickSearchItem,
    pickGridItem,
    focusZone,
    cats,
    activeCat,
  ]);

  return (
    <Paper
      aria-label={t("Emoji picker")}
      id="emoji-command"
      p={0}
      role="listbox"
      shadow="md"
      style={{ width: 280 }}
      withBorder
    >
      <div
        aria-atomic="true"
        aria-live="polite"
        role="status"
        style={{
          border: 0,
          clip: "rect(0,0,0,0)",
          height: 1,
          margin: -1,
          overflow: "hidden",
          padding: 0,
          position: "absolute",
          whiteSpace: "nowrap",
          width: 1,
        }}
      >
        {announce}
      </div>
      {searching ? (
        <>
          {isLoading && <Loader color="blue" m="xs" size="xs" type="dots" />}
          <ScrollArea.Autosize
            mah={260}
            scrollbarSize={6}
            viewportRef={listViewport}
          >
            <div style={{ padding: 4 }}>
              {items.length === 0 && !isLoading ? (
                <Text c="dimmed" p="xs" size="sm">
                  {t("No results")}
                </Text>
              ) : (
                items.map((item, i) => (
                  <UnstyledButton
                    aria-selected={i === idx}
                    className={clsx(classes.row, {
                      [classes.active]: i === idx,
                    })}
                    data-i={i}
                    key={item.id}
                    onClick={() => pickSearchItem(i)}
                    onMouseEnter={() => setIdx(i)}
                    role="option"
                    w="100%"
                  >
                    <span style={{ fontSize: 20, lineHeight: 1, minWidth: 26 }}>
                      {item.emoji}
                    </span>
                    <Text c="dimmed" ff="monospace" size="sm" span>
                      :{item.id}:
                    </Text>
                  </UnstyledButton>
                ))
              )}
            </div>
          </ScrollArea.Autosize>
        </>
      ) : browseLoading ? (
        <Loader color="blue" m="xs" size="xs" type="dots" />
      ) : (
        <>
          <div className={classes.catBar} ref={catBar} role="tablist">
            {cats.map((c) => {
              const isActive = c.id === activeCat;
              const isFocused = isActive && focusZone === "tabs";
              return (
                <button
                  aria-label={t("{{name}} category", { name: c.id })}
                  aria-selected={isActive}
                  className={clsx(classes.catTab, {
                    [classes.catTabActive]: isActive,
                    [classes.catTabFocused]: isFocused,
                  })}
                  data-cat={c.id}
                  key={c.id}
                  onClick={() => {
                    setActiveCat(c.id);
                    setFocusZone("grid");
                  }}
                  onMouseEnter={() => setFocusZone("grid")}
                  role="tab"
                  title={c.id}
                >
                  {CAT_ICONS[c.id] ?? "🔣"}
                </button>
              );
            })}
          </div>
          <ScrollArea.Autosize
            mah={220}
            scrollbarSize={6}
            viewportRef={gridViewport}
          >
            <div
              className={classes.grid}
              style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
            >
              {gridItems.map((entry, i) => (
                <button
                  aria-label={entry.id}
                  aria-selected={i === idx}
                  className={clsx(classes.emojiBtn, {
                    [classes.active]: i === idx,
                  })}
                  data-i={i}
                  key={entry.id}
                  onClick={() => pickGridItem(entry)}
                  onMouseEnter={() => setIdx(i)}
                  role="option"
                  title={`:${entry.id}:`}
                >
                  {entry.native}
                </button>
              ))}
            </div>
          </ScrollArea.Autosize>
        </>
      )}
    </Paper>
  );
}

export default EmojiList;
