import {
  ActionIcon,
  Button,
  Popover,
  ScrollArea,
  Tooltip,
} from "@mantine/core";
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconCheck,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

interface TableTextAlignmentProps {
  editor: Editor | null;
}

interface AlignmentItem {
  command: () => void;
  icon: React.ElementType;
  isActive: () => boolean;
  name: string;
  value: string;
}

export const TableTextAlignment: FC<TableTextAlignmentProps> = ({ editor }) => {
  const { t } = useTranslation();
  const [opened, setOpened] = React.useState(false);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      return {
        isAlignCenter: ctx.editor.isActive({ textAlign: "center" }),
        isAlignLeft: ctx.editor.isActive({ textAlign: "left" }),
        isAlignRight: ctx.editor.isActive({ textAlign: "right" }),
      };
    },
  });

  if (!(editor && editorState)) {
    return null;
  }

  const items: AlignmentItem[] = [
    {
      command: () => editor.chain().focus().setTextAlign("left").run(),
      icon: IconAlignLeft,
      isActive: () => editorState?.isAlignLeft,
      name: "Align left",
      value: "left",
    },
    {
      command: () => editor.chain().focus().setTextAlign("center").run(),
      icon: IconAlignCenter,
      isActive: () => editorState?.isAlignCenter,
      name: "Align center",
      value: "center",
    },
    {
      command: () => editor.chain().focus().setTextAlign("right").run(),
      icon: IconAlignRight,
      isActive: () => editorState?.isAlignRight,
      name: "Align right",
      value: "right",
    },
  ];

  const activeItem = items.find((item) => item.isActive()) || items[0];

  return (
    <Popover
      onChange={setOpened}
      opened={opened}
      position="bottom"
      transitionProps={{ transition: "pop" }}
      withArrow
    >
      <Popover.Target>
        <Tooltip label={t("Text align")} withArrow>
          <ActionIcon
            aria-label={t("Text align")}
            onClick={() => setOpened(!opened)}
            size="lg"
            variant="subtle"
          >
            <activeItem.icon size={18} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown>
        <ScrollArea.Autosize mah={300} type="scroll">
          <Button.Group orientation="vertical">
            {items.map((item, index) => (
              <Button
                fullWidth
                justify="left"
                key={index}
                leftSection={<item.icon size={16} />}
                onClick={() => {
                  item.command();
                  setOpened(false);
                }}
                rightSection={item.isActive() && <IconCheck size={16} />}
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
