import { isEditorReady } from "@docmost/editor-ext";
import { Button, Menu, rem, Tooltip } from "@mantine/core";
import {
  IconAlignCenter,
  IconAlignJustified,
  IconAlignLeft,
  IconAlignRight,
  IconCheck,
  IconChevronDown,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import React, { Dispatch, FC, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

interface TextAlignmentProps {
  editor: Editor | null;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export interface BubbleMenuItem {
  command: () => void;
  icon: React.ElementType;
  isActive: () => boolean;
  name: string;
}

export const TextAlignmentSelector: FC<TextAlignmentProps> = ({
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

      return {
        isAlignCenter: ctx.editor.isActive({ textAlign: "center" }),
        isAlignJustify: ctx.editor.isActive({ textAlign: "justify" }),
        isAlignLeft: ctx.editor.isActive({ textAlign: "left" }),
        isAlignRight: ctx.editor.isActive({ textAlign: "right" }),
      };
    },
  });

  if (!(editor && editorState)) {
    return null;
  }

  const items: BubbleMenuItem[] = [
    {
      command: () => editor.chain().focus().setTextAlign("left").run(),
      icon: IconAlignLeft,
      isActive: () => editorState?.isAlignLeft,
      name: "Align left",
    },
    {
      command: () => editor.chain().focus().setTextAlign("center").run(),
      icon: IconAlignCenter,
      isActive: () => editorState?.isAlignCenter,
      name: "Align center",
    },
    {
      command: () => editor.chain().focus().setTextAlign("right").run(),
      icon: IconAlignRight,
      isActive: () => editorState?.isAlignRight,
      name: "Align right",
    },
    {
      command: () => editor.chain().focus().setTextAlign("justify").run(),
      icon: IconAlignJustified,
      isActive: () => editorState?.isAlignJustify,
      name: "Justify",
    },
  ];

  const activeItem = items.filter((item) => item.isActive()).pop() ?? items[0];

  return (
    <Menu
      onChange={setIsOpen}
      opened={isOpen}
      position="bottom-start"
      shadow="md"
      withArrow={false}
    >
      <Menu.Target>
        <Tooltip
          disabled={isOpen}
          label={t("Text align")}
          withArrow
          withinPortal={false}
        >
          <Button
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-label={t("Text align")}
            onClick={() => setIsOpen(!isOpen)}
            onMouseDown={(e) => e.preventDefault()}
            px="5"
            radius="0"
            rightSection={<IconChevronDown size={16} />}
            style={{ border: "none", height: "34px" }}
            variant="default"
          >
            <activeItem.icon stroke={2} style={{ width: rem(16) }} />
          </Button>
        </Tooltip>
      </Menu.Target>

      <Menu.Dropdown>
        {items.map((item, index) => (
          <Menu.Item
            key={index}
            leftSection={<item.icon size={16} />}
            onClick={() => {
              if (isEditorReady(editor)) {
                item.command();
              }
              setIsOpen(false);
            }}
            rightSection={
              activeItem.name === item.name ? <IconCheck size={16} /> : null
            }
          >
            {t(item.name)}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};
