import {
  isCellSelection,
  isEditorReady,
  isTextSelected,
} from "@docmost/editor-ext";
import { ActionIcon, Tooltip } from "@mantine/core";
import {
  IconColumnInsertLeft,
  IconColumnInsertRight,
  IconColumnRemove,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconRowRemove,
  IconTableColumn,
  IconTableRow,
  IconTrashX,
} from "@tabler/icons-react";
import { Node as PMNode } from "@tiptap/pm/model";
import { findParentNode, posToDOMRect } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import React, { type JSX, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import classes from "../common/toolbar-menu.module.css";

export const TableMenu = React.memo(
  ({ editor }: EditorMenuProps): JSX.Element => {
    const { t } = useTranslation();
    const shouldShow = useCallback(
      ({ state }: ShouldShowProps) => {
        if (!state) {
          return false;
        }

        if (isTextSelected(editor)) {
          return false;
        }
        return editor.isActive("table") && !isCellSelection(state.selection);
      },
      [editor]
    );

    const getReferencedVirtualElement = useCallback(() => {
      if (!isEditorReady(editor)) {
        return;
      }
      const { selection } = editor.state;
      const predicate = (node: PMNode) => node.type.name === "table";
      const parent = findParentNode(predicate)(selection);

      if (parent) {
        const dom = editor.view.nodeDOM(parent?.pos) as HTMLElement;
        const rect = dom.getBoundingClientRect();
        return {
          getBoundingClientRect: () => rect,
          getClientRects: () => [rect],
        };
      }

      const rect = posToDOMRect(editor.view, selection.from, selection.to);
      return {
        getBoundingClientRect: () => rect,
        getClientRects: () => [rect],
      };
    }, [editor]);

    const toggleHeaderColumn = useCallback(() => {
      editor.chain().focus().toggleHeaderColumn().run();
    }, [editor]);

    const toggleHeaderRow = useCallback(() => {
      editor.chain().focus().toggleHeaderRow().run();
    }, [editor]);

    const addColumnLeft = useCallback(() => {
      editor.chain().focus().addColumnBefore().run();
    }, [editor]);

    const addColumnRight = useCallback(() => {
      editor.chain().focus().addColumnAfter().run();
    }, [editor]);

    const deleteColumn = useCallback(() => {
      editor.chain().focus().deleteColumn().run();
    }, [editor]);

    const addRowAbove = useCallback(() => {
      editor.chain().focus().addRowBefore().run();
    }, [editor]);

    const addRowBelow = useCallback(() => {
      editor.chain().focus().addRowAfter().run();
    }, [editor]);

    const deleteRow = useCallback(() => {
      editor.chain().focus().deleteRow().run();
    }, [editor]);

    const deleteTable = useCallback(() => {
      editor.chain().focus().deleteTable().run();
    }, [editor]);

    return (
      <BubbleMenu
        editor={editor}
        getReferencedVirtualElement={getReferencedVirtualElement}
        options={{
          flip: {
            boundary: editor.options.element as HTMLElement,
            fallbackPlacements: ["bottom", "top"],
            padding: {
              bottom: Number.NEGATIVE_INFINITY,
              left: 8,
              right: 8,
              top: 35 + 15,
            },
          },
          offset: {
            mainAxis: 15,
          },
          placement: "bottom",
          shift: {
            crossAxis: true,
            padding: 8 + 15,
          },
        }}
        pluginKey="table-menu"
        ref={(element) => {
          element.style.zIndex = "99";
        }}
        resizeDelay={0}
        shouldShow={shouldShow}
      >
        <div className={classes.toolbar}>
          <Tooltip
            label={t("Add left column")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Add left column")}
              onClick={addColumnLeft}
              size="lg"
              variant="subtle"
            >
              <IconColumnInsertLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={t("Add right column")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Add right column")}
              onClick={addColumnRight}
              size="lg"
              variant="subtle"
            >
              <IconColumnInsertRight size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={t("Delete column")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Delete column")}
              onClick={deleteColumn}
              size="lg"
              variant="subtle"
            >
              <IconColumnRemove size={18} />
            </ActionIcon>
          </Tooltip>

          <div className={classes.divider} />

          <Tooltip
            label={t("Add row above")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Add row above")}
              onClick={addRowAbove}
              size="lg"
              variant="subtle"
            >
              <IconRowInsertTop size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={t("Add row below")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Add row below")}
              onClick={addRowBelow}
              size="lg"
              variant="subtle"
            >
              <IconRowInsertBottom size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t("Delete row")} position="top" withinPortal={false}>
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

          <Tooltip
            label={t("Toggle header row")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Toggle header row")}
              onClick={toggleHeaderRow}
              size="lg"
              variant="subtle"
            >
              <IconTableRow size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={t("Toggle header column")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Toggle header column")}
              onClick={toggleHeaderColumn}
              size="lg"
              variant="subtle"
            >
              <IconTableColumn size={18} />
            </ActionIcon>
          </Tooltip>

          <div className={classes.divider} />

          <Tooltip
            label={t("Delete table")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Delete table")}
              onClick={deleteTable}
              size="lg"
              variant="subtle"
            >
              <IconTrashX size={18} />
            </ActionIcon>
          </Tooltip>
        </div>
      </BubbleMenu>
    );
  }
);

export default TableMenu;
