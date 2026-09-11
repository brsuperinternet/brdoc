import { Paper, ScrollArea, Text, VisuallyHidden } from "@mantine/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  SlashMenuGroupedItemsType,
  SlashMenuItemType,
} from "@/features/editor/components/slash-menu/types";

const CommandList = ({
  items,
  command,
}: {
  items: SlashMenuGroupedItemsType;
  command: any;
}) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [countAnnouncement, setCountAnnouncement] = useState("");
  const [selectionAnnouncement, setSelectionAnnouncement] = useState("");

  // Without the bases entitlement the item stays visible but inert; an
  // expired license the client can't detect falls through to a handled
  // create failure.
  const isItemDisabled = (item: SlashMenuItemType) =>
    item.requiresBases === true;

  const flatItems = useMemo(() => Object.values(items).flat(), [items]);

  const selectItem = useCallback(
    (index: number) => {
      const item = flatItems[index];
      if (item && !isItemDisabled(item)) {
        command(item);
      }
    },
    [command, flatItems]
  );

  useEffect(() => {
    const navigationKeys = ["ArrowUp", "ArrowDown", "Enter"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault();

        if (e.key === "ArrowUp") {
          setSelectedIndex(
            (selectedIndex + flatItems.length - 1) % flatItems.length
          );
          return true;
        }

        if (e.key === "ArrowDown") {
          setSelectedIndex((selectedIndex + 1) % flatItems.length);
          return true;
        }

        if (e.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [flatItems, selectedIndex, setSelectedIndex, selectItem]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems]);

  useEffect(() => {
    if (flatItems.length === 0) {
      setCountAnnouncement("");
      return;
    }
    setCountAnnouncement(
      t("{{count}} command available", { count: flatItems.length })
    );
  }, [flatItems.length, t]);

  useEffect(() => {
    const item = flatItems[selectedIndex];
    if (!item) {
      setSelectionAnnouncement("");
      return;
    }
    setSelectionAnnouncement(`${t(item.title)}, ${t(item.description)}`);
  }, [selectedIndex, flatItems, t]);

  useEffect(() => {
    viewportRef.current
      ?.querySelector(`[data-item-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return flatItems.length > 0 ? (
    <Paper
      aria-activedescendant={`slash-command-option-${selectedIndex}`}
      aria-label={t("Slash commands")}
      id="slash-command"
      p="xs"
      role="listbox"
      shadow="md"
      withBorder
    >
      <VisuallyHidden aria-atomic="true" aria-live="polite" role="status">
        {countAnnouncement}
      </VisuallyHidden>
      <VisuallyHidden aria-atomic="true" aria-live="polite" role="status">
        {selectionAnnouncement}
      </VisuallyHidden>
      <ScrollArea
        h={350}
        overscrollBehavior="contain"
        scrollbarSize={8}
        viewportRef={viewportRef}
        w={270}
      >
        {(() =>
          Object.entries(items).map(([category]) => (
            <div aria-label={category} key={category} role="group">
              <Text c="dimmed" fw={500} mb={4} tt="capitalize">
                {category}
              </Text>
            </div>
          )))()}
      </ScrollArea>
    </Paper>
  ) : null;
};

export default CommandList;
