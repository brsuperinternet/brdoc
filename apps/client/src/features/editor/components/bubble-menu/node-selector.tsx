import { isEditorReady } from "@docmost/editor-ext";
import { Button, Popover, ScrollArea, Tooltip } from "@mantine/core";
import {
  IconBlockquote,
  IconCaretRightFilled,
  IconCheck,
  IconCheckbox,
  IconChevronDown,
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconInfoCircle,
  IconList,
  IconListNumbers,
  IconQuote,
  IconTypography,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import React, { Dispatch, FC, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import classes from "./bubble-menu.module.css";

interface NodeSelectorProps {
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

export const NodeSelector: FC<NodeSelectorProps> = ({
  editor,
  isOpen,
  setIsOpen,
}) => {
  const { t } = useTranslation();

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!editor) {
        return null;
      }

      return {
        isBlockquote: ctx.editor.isActive("blockquote"),
        isBulletList: ctx.editor.isActive("bulletList"),
        isCallout: ctx.editor.isActive("callout"),
        isCodeBlock: ctx.editor.isActive("codeBlock"),
        isDetails: ctx.editor.isActive("details"),
        isHeading1: ctx.editor.isActive("heading", { level: 1 }),
        isHeading2: ctx.editor.isActive("heading", { level: 2 }),
        isHeading3: ctx.editor.isActive("heading", { level: 3 }),
        isOrderedList: ctx.editor.isActive("orderedList"),
        isParagraph: ctx.editor.isActive("paragraph"),
        isTaskItem: ctx.editor.isActive("taskItem"),
        isTransclusionSource: ctx.editor.isActive("transclusionSource"),
      };
    },
  });

  const items: BubbleMenuItem[] = [
    {
      command: () =>
        editor.chain().focus().toggleNode("paragraph", "paragraph").run(),
      icon: IconTypography,
      isActive: () =>
        editorState?.isParagraph &&
        !editorState?.isBulletList &&
        !editorState?.isOrderedList,
      name: "Text",
    },
    {
      command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      icon: IconH1,
      isActive: () => editorState?.isHeading1,
      name: "Heading 1",
    },
    {
      command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      icon: IconH2,
      isActive: () => editorState?.isHeading2,
      name: "Heading 2",
    },
    {
      command: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      icon: IconH3,
      isActive: () => editorState?.isHeading3,
      name: "Heading 3",
    },
    {
      command: () => editor.chain().focus().toggleTaskList().run(),
      icon: IconCheckbox,
      isActive: () => editorState?.isTaskItem,
      name: "To-do List",
    },
    {
      command: () => editor.chain().focus().toggleBulletList().run(),
      icon: IconList,
      isActive: () => editorState?.isBulletList,
      name: "Bullet List",
    },
    {
      command: () => editor.chain().focus().toggleOrderedList().run(),
      icon: IconListNumbers,
      isActive: () => editorState?.isOrderedList,
      name: "Numbered List",
    },
    {
      command: () =>
        editor
          .chain()
          .focus()
          .toggleNode("paragraph", "paragraph")
          .toggleBlockquote()
          .run(),
      icon: IconBlockquote,
      isActive: () => editorState?.isBlockquote,
      name: "Blockquote",
    },
    {
      command: () => editor.chain().focus().toggleTransclusionSource().run(),
      icon: IconQuote,
      isActive: () => editorState?.isTransclusionSource,
      name: "Synced block",
    },
    {
      command: () => editor.chain().focus().toggleCodeBlock().run(),
      icon: IconCode,
      isActive: () => editorState?.isCodeBlock,
      name: "Code",
    },
    {
      command: () => editor.chain().focus().toggleCallout().run(),
      icon: IconInfoCircle,
      isActive: () => editorState?.isCallout,
      name: "Callout",
    },
    {
      command: () => editor.chain().focus().setDetails().run(),
      icon: IconCaretRightFilled,
      isActive: () => editorState?.isDetails,
      name: "Toggle block",
    },
  ];

  const activeItem = items.filter((item) => item.isActive()).pop() ?? {
    name: "Multiple",
  };

  return (
    <Popover onChange={setIsOpen} opened={isOpen} withArrow>
      <Popover.Target>
        <Tooltip
          disabled={isOpen}
          label={t("Turn into")}
          withArrow
          withinPortal={false}
        >
          <Button
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-label={t("Turn into")}
            className={classes.buttonRoot}
            onClick={() => setIsOpen(!isOpen)}
            radius="0"
            rightSection={<IconChevronDown size={16} />}
            style={{ border: "none", height: "34px" }}
            variant="default"
          >
            {t(activeItem?.name)}
          </Button>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown>
        <ScrollArea.Autosize mah={400} type="scroll">
          <Button.Group orientation="vertical">
            {items.map((item, index) => (
              <Button
                fullWidth
                justify="left"
                key={index}
                leftSection={<item.icon size={16} />}
                onClick={() => {
                  if (isEditorReady(editor)) {
                    item.command();
                  }
                  setIsOpen(false);
                }}
                rightSection={
                  activeItem.name === item.name && <IconCheck size={16} />
                }
                style={{ border: "none" }}
                variant="default"
              >
                {t(item.name)}
              </Button>
            ))}
          </Button.Group>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
};
