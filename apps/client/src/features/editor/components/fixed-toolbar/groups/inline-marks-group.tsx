import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import {
  IconBold,
  IconChevronDown,
  IconClearFormatting,
  IconCode,
  IconIndentDecrease,
  IconIndentIncrease,
  IconItalic,
  IconStrikethrough,
  IconSubscript,
  IconSuperscript,
  IconUnderline,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import clsx from "clsx";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import classes from "../fixed-toolbar.module.css";
import type { ToolbarState } from "../use-toolbar-state";

interface Props {
  editor: Editor;
  state: ToolbarState;
}

export const InlineMarksGroup: FC<Props> = ({ editor, state }) => {
  const { t } = useTranslation();

  return (
    <ActionIcon.Group>
      <Tooltip label={t("Bold")} withArrow>
        <ActionIcon
          aria-label={t("Bold")}
          aria-pressed={state.isBold}
          className={clsx({ [classes.active]: state.isBold })}
          color="dark"
          onClick={() => editor.chain().focus().toggleBold().run()}
          size="md"
          variant="subtle"
        >
          <IconBold size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t("Underline")} withArrow>
        <ActionIcon
          aria-label={t("Underline")}
          aria-pressed={state.isUnderline}
          className={clsx({ [classes.active]: state.isUnderline })}
          color="dark"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          size="md"
          variant="subtle"
        >
          <IconUnderline size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t("Italic")} withArrow>
        <ActionIcon
          aria-label={t("Italic")}
          aria-pressed={state.isItalic}
          className={clsx({ [classes.active]: state.isItalic })}
          color="dark"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          size="md"
          variant="subtle"
        >
          <IconItalic size={16} />
        </ActionIcon>
      </Tooltip>
      <Menu position="bottom-start" shadow="md" withArrow={false}>
        <Menu.Target>
          <ActionIcon
            aria-label={t("More inline formatting")}
            color="dark"
            size="md"
            variant="subtle"
          >
            <IconChevronDown size={14} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconStrikethrough size={16} />}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            {t("Strikethrough")}
          </Menu.Item>
          <Menu.Item
            leftSection={<IconCode size={16} />}
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            {t("Inline code")}
          </Menu.Item>
          <Menu.Item
            leftSection={<IconSubscript size={16} />}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
          >
            {t("Subscript")}
          </Menu.Item>
          <Menu.Item
            leftSection={<IconSuperscript size={16} />}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
          >
            {t("Superscript")}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconIndentIncrease size={16} />}
            onClick={() => editor.chain().focus().indent().run()}
          >
            {t("Increase indent")}
          </Menu.Item>
          <Menu.Item
            leftSection={<IconIndentDecrease size={16} />}
            onClick={() => editor.chain().focus().outdent().run()}
          >
            {t("Decrease indent")}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconClearFormatting size={16} />}
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
          >
            {t("Clear formatting")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </ActionIcon.Group>
  );
};
