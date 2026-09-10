import { ActionIcon, Tooltip } from "@mantine/core";
import { IconCheckbox, IconList, IconListNumbers } from "@tabler/icons-react";
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

export const ListsGroup: FC<Props> = ({ editor, state }) => {
  const { t } = useTranslation();

  return (
    <ActionIcon.Group>
      <Tooltip label={t("Bullet List")} withArrow>
        <ActionIcon
          aria-label={t("Bullet List")}
          aria-pressed={state.isBulletList}
          className={clsx({ [classes.active]: state.isBulletList })}
          color="dark"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          size="md"
          variant="subtle"
        >
          <IconList size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t("Numbered List")} withArrow>
        <ActionIcon
          aria-label={t("Numbered List")}
          aria-pressed={state.isOrderedList}
          className={clsx({ [classes.active]: state.isOrderedList })}
          color="dark"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          size="md"
          variant="subtle"
        >
          <IconListNumbers size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t("To-do List")} withArrow>
        <ActionIcon
          aria-label={t("To-do List")}
          aria-pressed={state.isTaskList}
          className={clsx({ [classes.active]: state.isTaskList })}
          color="dark"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          size="md"
          variant="subtle"
        >
          <IconCheckbox size={16} />
        </ActionIcon>
      </Tooltip>
    </ActionIcon.Group>
  );
};
