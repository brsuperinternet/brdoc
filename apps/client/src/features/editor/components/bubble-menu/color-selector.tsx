import { isEditorReady } from "@docmost/editor-ext";
import {
  Box,
  Button,
  Popover,
  rem,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import clsx from "clsx";
import React, { Dispatch, FC, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import classes from "./bubble-menu.module.css";

export interface BubbleColorMenuItem {
  color: string;
  name: string;
}

interface ColorSelectorProps {
  editor: Editor | null;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const TEXT_COLORS: BubbleColorMenuItem[] = [
  {
    color: "",
    name: "Default",
  },
  {
    color: "#2563EB",
    name: "Blue",
  },
  {
    color: "#008A00",
    name: "Green",
  },
  {
    color: "#9333EA",
    name: "Purple",
  },
  {
    color: "#E00000",
    name: "Red",
  },
  {
    color: "#EAB308",
    name: "Yellow",
  },
  {
    color: "#FFA500",
    name: "Orange",
  },
  {
    color: "#BA4081",
    name: "Pink",
  },
  {
    color: "#A8A29E",
    name: "Gray",
  },
  {
    color: "#92400E",
    name: "Brown",
  },
];

const HIGHLIGHT_COLORS: BubbleColorMenuItem[] = [
  {
    color: "",
    name: "Default",
  },
  {
    color: "#98d8f2",
    name: "Blue",
  },
  {
    color: "#7edb6c",
    name: "Green",
  },
  {
    color: "#e0d6ed",
    name: "Purple",
  },
  {
    color: "#ffc6c2",
    name: "Red",
  },
  {
    color: "#faf594",
    name: "Yellow",
  },
  {
    color: "#f5c8a9",
    name: "Orange",
  },
  {
    color: "#f5cfe0",
    name: "Pink",
  },
  {
    color: "#dfdfd7",
    name: "Gray",
  },
  {
    color: "#d7c4b7",
    name: "Brown",
  },
];

const COLOR_GRID_COLS = 5;

function focusSwatch(grid: "text" | "highlight", index: number) {
  const el = document.querySelector<HTMLElement>(
    `[data-color-grid="${grid}"][data-color-index="${index}"]`
  );
  el?.focus();
}

function handleColorKeyNav(
  e: React.KeyboardEvent<HTMLDivElement>,
  index: number,
  grid: "text" | "highlight"
) {
  const cols = COLOR_GRID_COLS;
  const total = grid === "text" ? TEXT_COLORS.length : HIGHLIGHT_COLORS.length;
  const col = index % cols;

  if (e.key === "ArrowRight") {
    e.preventDefault();
    if (index < total - 1) {
      focusSwatch(grid, index + 1);
    }
    return;
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (index > 0) {
      focusSwatch(grid, index - 1);
    }
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    const next = index + cols;
    if (next < total) {
      focusSwatch(grid, next);
    } else if (grid === "text") {
      focusSwatch("highlight", Math.min(col, HIGHLIGHT_COLORS.length - 1));
    } else if (grid === "highlight") {
      document
        .querySelector<HTMLElement>('[data-color-grid="remove"]')
        ?.focus();
    }
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    const prev = index - cols;
    if (prev >= 0) {
      focusSwatch(grid, prev);
    } else if (grid === "highlight") {
      const lastRowStart = Math.floor((TEXT_COLORS.length - 1) / cols) * cols;
      focusSwatch("text", Math.min(lastRowStart + col, TEXT_COLORS.length - 1));
    }
  }
}

export const ColorSelector: FC<ColorSelectorProps> = ({
  editor,
  isOpen,
  setIsOpen,
}) => {
  const { t } = useTranslation();

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      const activeColors: Record<string, boolean> = {};
      TEXT_COLORS.forEach(({ color }) => {
        activeColors[`text_${color}`] = ctx.editor.isActive("textStyle", {
          color,
        });
      });
      HIGHLIGHT_COLORS.forEach(({ color }) => {
        activeColors[`highlight_${color}`] = ctx.editor.isActive("highlight", {
          color,
        });
      });

      return activeColors;
    },
  });

  if (!(editor && editorState)) {
    return null;
  }

  const activeColorItem = TEXT_COLORS.find(
    ({ color }) => editorState[`text_${color}`]
  );

  const activeHighlightItem = HIGHLIGHT_COLORS.find(
    ({ color }) => editorState[`highlight_${color}`]
  );

  return (
    <Popover
      onChange={setIsOpen}
      opened={isOpen}
      trapFocus
      width={220}
      withArrow
    >
      <Popover.Target>
        <Tooltip label={t("Text color")} withArrow withinPortal={false}>
          <Button
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-label={t("Text color")}
            className={clsx(["color-selector-trigger", classes.buttonRoot])}
            data-highlight-color={activeHighlightItem?.color || ""}
            data-text-color={activeColorItem?.color || ""}
            onClick={() => setIsOpen(!isOpen)}
            onMouseDown={(e) => e.preventDefault()}
            radius="0"
            rightSection={<IconChevronDown size={16} />}
            style={{
              fontSize: rem(16),
              fontWeight: 500,
            }}
            variant="default"
          >
            A
          </Button>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown onMouseDown={(e) => e.preventDefault()}>
        <Stack gap="md" p="2px">
          <Box>
            <Text fw={600} mb="xs" size="sm">
              {t("Text color")}
            </Text>
            <SimpleGrid cols={5} spacing="xs">
              {TEXT_COLORS.map(({ name, color }, index) => {
                const applyTextColor = () => {
                  if (!isEditorReady(editor)) {
                    return;
                  }
                  if (name === "Default") {
                    editor.commands.unsetColor();
                  } else {
                    editor
                      .chain()
                      .focus()
                      .setColor(color || "")
                      .run();
                  }
                  setIsOpen(false);
                };
                return (
                  <Tooltip key={index} label={t(name)} withArrow>
                    <Box
                      aria-label={t(name)}
                      aria-pressed={!!editorState[`text_${color}`]}
                      className={classes.colorSwatch}
                      data-autofocus={index === 0 ? true : undefined}
                      data-color-grid="text"
                      data-color-index={index}
                      onClick={applyTextColor}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          applyTextColor();
                          return;
                        }
                        handleColorKeyNav(e, index, "text");
                      }}
                      role="button"
                      style={{
                        alignItems: "center",
                        border: editorState[`text_${color}`]
                          ? "2px solid var(--mantine-color-gray-8)"
                          : "1px solid var(--mantine-color-gray-4)",
                        borderRadius: rem(6),
                        color: color || "var(--mantine-color-gray-8)",
                        cursor: "pointer",
                        display: "flex",
                        fontSize: rem(16),
                        fontWeight: 600,
                        height: rem(28),
                        justifyContent: "center",
                        position: "relative",
                        width: rem(28),
                      }}
                      tabIndex={0}
                    >
                      A
                    </Box>
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </Box>

          <Box>
            <Text fw={600} mb="xs" size="sm">
              {t("Highlight color")}
            </Text>
            <SimpleGrid cols={5} spacing="xs">
              {HIGHLIGHT_COLORS.map(({ name, color }, index) => {
                const applyHighlight = () => {
                  if (!isEditorReady(editor)) {
                    return;
                  }
                  if (name === "Default") {
                    editor.commands.unsetHighlight();
                  } else {
                    editor
                      .chain()
                      .focus()
                      .toggleMark("highlight", {
                        color: color || "",
                        colorName: name.toLowerCase() || "",
                      })
                      .run();
                  }
                  setIsOpen(false);
                };
                return (
                  <Tooltip key={index} label={t(name)} withArrow>
                    <Box
                      aria-label={t(name)}
                      aria-pressed={!!editorState[`highlight_${color}`]}
                      className={classes.colorSwatch}
                      data-color-grid="highlight"
                      data-color-index={index}
                      onClick={applyHighlight}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          applyHighlight();
                          return;
                        }
                        handleColorKeyNav(e, index, "highlight");
                      }}
                      role="button"
                      style={{
                        alignItems: "center",
                        backgroundColor: color || "var(--mantine-color-gray-2)",
                        border: "1px solid var(--mantine-color-gray-4)",
                        borderRadius: rem(4),
                        color: "var(--mantine-color-gray-8)",
                        cursor: "pointer",
                        display: "flex",
                        fontSize: rem(16),
                        fontWeight: 600,
                        height: rem(28),
                        justifyContent: "center",
                        position: "relative",
                        width: rem(28),
                      }}
                      tabIndex={0}
                    >
                      {editorState[`highlight_${color}`] ? (
                        <IconCheck
                          color="var(--mantine-color-green-7)"
                          size={16}
                        />
                      ) : (
                        "A"
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </Box>

          <Button
            className={classes.removeColor}
            data-color-grid="remove"
            fullWidth
            onClick={() => {
              if (isEditorReady(editor)) {
                editor.commands.unsetColor();
                editor.commands.unsetHighlight();
              }
              setIsOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                const lastRowStart =
                  Math.floor((HIGHLIGHT_COLORS.length - 1) / COLOR_GRID_COLS) *
                  COLOR_GRID_COLS;
                focusSwatch("highlight", lastRowStart);
              }
            }}
            variant="default"
          >
            {t("Remove color")}
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
