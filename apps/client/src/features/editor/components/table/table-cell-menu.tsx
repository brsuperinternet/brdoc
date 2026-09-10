import { isCellSelection } from "@docmost/editor-ext";
import { ActionIcon, Tooltip } from "@mantine/core";
import {
  IconBoxMargin,
  IconColumnRemove,
  IconRowRemove,
  IconSquareToggle,
  IconTableRow,
} from "@tabler/icons-react";
import { BubbleMenu } from "@tiptap/react/menus";
import React, { type JSX, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import classes from "../common/toolbar-menu.module.css";
import { TableBackgroundColor } from "./table-background-color";
import { TableTextAlignment } from "./table-text-alignment";

export const TableCellMenu = React.memo(
  ({ editor, appendTo }: EditorMenuProps): JSX.Element => {
    const { t } = useTranslation();
    const shouldShow = useCallback(
      ({ view, state, from }: ShouldShowProps) => {
        if (!state) {
          return false;
        }

        return isCellSelection(state.selection);
      },
      [editor]
    );

    const mergeCells = useCallback(() => {
      editor.chain().focus().mergeCells().run();
    }, [editor]);

    const splitCell = useCallback(() => {
      editor.chain().focus().splitCell().run();
    }, [editor]);

    const deleteColumn = useCallback(() => {
      editor.chain().focus().deleteColumn().run();
    }, [editor]);

    const deleteRow = useCallback(() => {
      editor.chain().focus().deleteRow().run();
    }, [editor]);

    const toggleHeaderCell = useCallback(() => {
      editor.chain().focus().toggleHeaderCell().run();
    }, [editor]);

    return (
      <BubbleMenu
        appendTo={() => appendTo?.current}
        editor={editor}
        options={{
          offset: {
            mainAxis: 15,
          },
        }}
        pluginKey="table-cell-menu"
        ref={(element) => {
          element.style.zIndex = "99";
        }}
        shouldShow={shouldShow}
        updateDelay={0}
      >
        <div className={classes.toolbar}>
          <TableBackgroundColor editor={editor} />
          <TableTextAlignment editor={editor} />

          <div className={classes.divider} />

          <Tooltip label={t("Merge cells")} position="top">
            <ActionIcon
              aria-label={t("Merge cells")}
              onClick={mergeCells}
              size="lg"
              variant="subtle"
            >
              <IconBoxMargin size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t("Split cell")} position="top">
            <ActionIcon
              aria-label={t("Split cell")}
              onClick={splitCell}
              size="lg"
              variant="subtle"
            >
              <IconSquareToggle size={18} />
            </ActionIcon>
          </Tooltip>

          <div className={classes.divider} />

          <Tooltip label={t("Delete column")} position="top">
            <ActionIcon
              aria-label={t("Delete column")}
              onClick={deleteColumn}
              size="lg"
              variant="subtle"
            >
              <IconColumnRemove size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t("Delete row")} position="top">
            <ActionIcon
              aria-label={t("Delete row")}
              onClick={deleteRow}
              size="lg"
              variant="subtle"
            >
              <IconRowRemove size={18} />
            </ActionIcon>
          </Tooltip>

          <div className={classes.divider} />

          <Tooltip label={t("Toggle header cell")} position="top">
            <ActionIcon
              aria-label={t("Toggle header cell")}
              onClick={toggleHeaderCell}
              size="lg"
              variant="subtle"
            >
              <IconTableRow size={18} />
            </ActionIcon>
          </Tooltip>
        </div>
      </BubbleMenu>
    );
  }
);

export default TableCellMenu;
