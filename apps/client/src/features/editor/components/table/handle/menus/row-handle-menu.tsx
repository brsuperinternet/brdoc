import { ColorSwatch, Menu } from "@mantine/core";
import {
  IconArrowDown,
  IconArrowUp,
  IconEraser,
  IconPalette,
  IconRowInsertBottom,
  IconRowInsertTop,
  IconRowRemove,
} from "@tabler/icons-react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
import React from "react";
import { useTranslation } from "react-i18next";
import { TABLE_COLORS } from "../../table-background-color";
import { useTableClear } from "../hooks/use-table-clear";
import { useTableMoveRowColumn } from "../hooks/use-table-move-row-column";
import { AlignmentSubmenu } from "./alignment-submenu";

interface RowHandleMenuProps {
  editor: Editor;
  index: number;
  tableNode: ProseMirrorNode;
  tablePos: number;
}

export const RowHandleMenu = React.memo(function RowHandleMenu({
  editor,
  index,
  tableNode,
  tablePos,
}: RowHandleMenuProps) {
  const { t } = useTranslation();

  const setBackground = (color: string, name: string) => {
    editor
      .chain()
      .focus()
      .updateAttributes("tableCell", {
        backgroundColor: color || null,
        backgroundColorName: color ? name : null,
      })
      .updateAttributes("tableHeader", {
        backgroundColor: color || null,
        backgroundColorName: color ? name : null,
      })
      .run();
  };

  const moveUp = useTableMoveRowColumn(
    editor,
    "row",
    index,
    "up",
    tableNode,
    tablePos
  );
  const moveDown = useTableMoveRowColumn(
    editor,
    "row",
    index,
    "down",
    tableNode,
    tablePos
  );
  const clearRow = useTableClear(editor, tableNode, tablePos, {
    index,
    kind: "row",
  });

  return (
    <>
      <Menu.Sub position="right-start">
        <Menu.Sub.Target>
          <Menu.Sub.Item leftSection={<IconPalette size={16} />}>
            {t("Background color")}
          </Menu.Sub.Item>
        </Menu.Sub.Target>
        <Menu.Sub.Dropdown>
          <div
            style={{
              display: "grid",
              gap: 8,
              gridTemplateColumns: "repeat(4, 1fr)",
              padding: 8,
            }}
          >
            {TABLE_COLORS.map((c) => (
              <button
                aria-label={t(c.name)}
                key={c.name}
                onClick={() => setBackground(c.color, c.name)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                type="button"
              >
                <ColorSwatch
                  color={c.color || "#ffffff"}
                  size={22}
                  style={{
                    border: c.color === "" ? "1px solid #e5e7eb" : undefined,
                  }}
                />
              </button>
            ))}
          </div>
        </Menu.Sub.Dropdown>
      </Menu.Sub>

      <AlignmentSubmenu editor={editor} />

      <Menu.Divider />

      <Menu.Item
        leftSection={<IconRowInsertTop size={16} />}
        onClick={() => editor.chain().focus().addRowBefore().run()}
      >
        {t("Add row above")}
      </Menu.Item>
      <Menu.Item
        leftSection={<IconRowInsertBottom size={16} />}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        {t("Add row below")}
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item leftSection={<IconEraser size={16} />} onClick={clearRow}>
        {t("Clear cells")}
      </Menu.Item>
      <Menu.Item
        leftSection={<IconRowRemove size={16} />}
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        {t("Delete row")}
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item
        disabled={!moveUp.canMove}
        leftSection={<IconArrowUp size={16} />}
        onClick={moveUp.handleMove}
      >
        {t("Move row up")}
      </Menu.Item>
      <Menu.Item
        disabled={!moveDown.canMove}
        leftSection={<IconArrowDown size={16} />}
        onClick={moveDown.handleMove}
      >
        {t("Move row down")}
      </Menu.Item>
    </>
  );
});
