import { ActionIcon, Tooltip } from "@mantine/core";
import { IconArrowBackUp, IconArrowForwardUp } from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import type { ToolbarState } from "../use-toolbar-state";

interface Props {
  editor: Editor;
  state: ToolbarState;
}

export const HistoryGroup: FC<Props> = ({ editor, state }) => {
  const { t } = useTranslation();

  return (
    <ActionIcon.Group>
      <Tooltip label={t("Undo")} withArrow>
        <ActionIcon
          aria-label={t("Undo")}
          color="dark"
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
          size="md"
          variant="subtle"
        >
          <IconArrowBackUp size={16} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t("Redo")} withArrow>
        <ActionIcon
          aria-label={t("Redo")}
          color="dark"
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
          size="md"
          variant="subtle"
        >
          <IconArrowForwardUp size={16} />
        </ActionIcon>
      </Tooltip>
    </ActionIcon.Group>
  );
};
