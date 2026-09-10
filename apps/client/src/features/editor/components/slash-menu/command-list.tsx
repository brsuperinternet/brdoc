import {
  ActionIcon,
  Badge,
  Group,
  Paper,
  ScrollArea,
  Text,
  Tooltip,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import {
  SlashMenuGroupedItemsType,
  SlashMenuItemType,
} from "@/features/editor/components/slash-menu/types";
import classes from "./slash-menu.module.css";

const CommandList = ({
  items,
  command,
  editor,
  range,
}: {
  items: SlashMenuGroupedItemsType;
  command: any;
  editor: any;
  range: any;
}) => {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [countAnnouncement, setCountAnnouncement] = useState("");
  const [selectionAnnouncement, setSelectionAnnouncement] = useState("");

  const hasBases = useHasFeature(Feature.BASES);
  const upgradeLabel = useUpgradeLabel();
  // Without the bases entitlement the item stays visible but inert; an
  // expired license the client can't detect falls through to a handled
  // create failure.
  const isItemDisabled = (item: SlashMenuItemType) =>
    !hasBases && item.requiresBases === true;

  const flatItems = useMemo(() => Object.values(items).flat(), [items]);

  const selectItem = useCallback(
    (index: number) => {
      const item = flatItems[index];
      if (item && !isItemDisabled(item)) {
        command(item);
      }
    },
    [command, flatItems, hasBases]
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
        {(() => {
          let flatIndex = -1;
          return Object.entries(items).map(([category, categoryItems]) => (
            <div aria-label={category} key={category} role="group">
              <Text c="dimmed" fw={500} mb={4} tt="capitalize">
                {category}
              </Text>
              {categoryItems.map((item: SlashMenuItemType) => {
                flatIndex += 1;
                const itemIndex = flatIndex;
                const disabled = isItemDisabled(item);
                return (
                  <Tooltip
                    disabled={!disabled}
                    key={itemIndex}
                    label={upgradeLabel}
                    position="right"
                  >
                    <UnstyledButton
                      aria-disabled={disabled}
                      aria-selected={itemIndex === selectedIndex}
                      className={clsx(classes.menuBtn, {
                        [classes.selectedItem]: itemIndex === selectedIndex,
                        [classes.gatedItem]: disabled,
                      })}
                      data-item-index={itemIndex}
                      id={`slash-command-option-${itemIndex}`}
                      onClick={() => selectItem(itemIndex)}
                      role="option"
                    >
                      <Group wrap="nowrap">
                        <ActionIcon
                          aria-hidden="true"
                          component="div"
                          variant="default"
                        >
                          <item.icon size={18} />
                        </ActionIcon>

                        <div style={{ flex: 1 }}>
                          <Text fw={500} size="sm">
                            {t(item.title)}
                          </Text>

                          <Text c="dimmed" size="xs">
                            {t(item.description)}
                          </Text>
                        </div>

                        {disabled && (
                          <Badge color="gray" size="xs" variant="light">
                            {t("Upgrade")}
                          </Badge>
                        )}
                      </Group>
                    </UnstyledButton>
                  </Tooltip>
                );
              })}
            </div>
          ));
        })()}
      </ScrollArea>
    </Paper>
  ) : null;
};

export default CommandList;
