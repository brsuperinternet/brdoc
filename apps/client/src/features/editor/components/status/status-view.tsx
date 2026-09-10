import type { StatusColor } from "@docmost/editor-ext";
import { Box, Group, Popover, TextInput } from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import { IconCheck } from "@tabler/icons-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import classes from "./status.module.css";

const STATUS_COLORS: { name: StatusColor; bg: string }[] = [
  { bg: "var(--mantine-color-gray-4)", name: "gray" },
  { bg: "var(--mantine-color-blue-4)", name: "blue" },
  { bg: "var(--mantine-color-green-4)", name: "green" },
  { bg: "var(--mantine-color-yellow-4)", name: "yellow" },
  { bg: "var(--mantine-color-red-4)", name: "red" },
  { bg: "var(--mantine-color-violet-4)", name: "purple" },
];

const colorClassMap: Record<StatusColor, string> = {
  blue: classes.colorBlue,
  gray: classes.colorGray,
  green: classes.colorGreen,
  purple: classes.colorPurple,
  red: classes.colorRed,
  yellow: classes.colorYellow,
};

export default function StatusView(props: NodeViewProps) {
  const { node, updateAttributes, deleteNode, editor, getPos } = props;
  const { text, color } = node.attrs as {
    text: string;
    color: StatusColor;
  };

  const [opened, setOpened] = useState(false);
  const [inputValue, setInputValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storage = editor.storage?.status;
    if (storage?.autoOpen) {
      storage.autoOpen = false;
      setOpened(true);
    }
  }, []);

  useEffect(() => {
    if (opened) {
      setInputValue(text);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [opened]);

  const debouncedUpdateAttributes = useDebouncedCallback(
    (val: string) => updateAttributes({ text: val }),
    100
  );

  const handleTextChange = (val: string) => {
    setInputValue(val);
    debouncedUpdateAttributes(val);
  };

  const handleColorChange = (newColor: StatusColor) => {
    updateAttributes({ color: newColor });
  };

  const isEditable = editor.isEditable;

  return (
    <NodeViewWrapper data-drag-handle style={{ display: "inline" }}>
      <Popover
        onChange={(open) => {
          if (!(open || text)) {
            deleteNode();
            return;
          }
          setOpened(open);
        }}
        opened={opened}
        position="bottom"
        shadow="md"
        trapFocus
        width={220}
        withArrow
      >
        <Popover.Target>
          <span
            aria-expanded={opened}
            aria-haspopup="dialog"
            aria-label={text || "SET STATUS"}
            className={clsx(
              "status-badge",
              classes.status,
              colorClassMap[color]
            )}
            onClick={() => isEditable && setOpened(true)}
            onKeyDown={(e) => {
              if (isEditable && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpened(true);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {text || "SET STATUS"}
          </span>
        </Popover.Target>

        <Popover.Dropdown>
          <TextInput
            mb="xs"
            onChange={(e) =>
              handleTextChange(e.currentTarget.value.toUpperCase())
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setOpened(false);
                editor.commands.focus(getPos() + node.nodeSize);
              }
            }}
            placeholder="Status text"
            ref={inputRef}
            size="sm"
            value={inputValue}
          />

          <Group gap={6} justify="center">
            {STATUS_COLORS.map(({ name, bg }) => (
              <Box
                aria-label={name}
                aria-pressed={color === name}
                className={clsx(
                  classes.swatch,
                  color === name && classes.swatchActive
                )}
                key={name}
                onClick={() => handleColorChange(name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleColorChange(name);
                  }
                }}
                role="button"
                style={{ backgroundColor: bg }}
                tabIndex={0}
              >
                {color === name && <IconCheck size={14} />}
              </Box>
            ))}
          </Group>
        </Popover.Dropdown>
      </Popover>
    </NodeViewWrapper>
  );
}
