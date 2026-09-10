import { isEditorReady } from "@docmost/editor-ext";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { Editor } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import { findParentNode, posToDOMRect } from "@tiptap/react";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react/menus";
import React, { type JSX, useCallback } from "react";
import { useTranslation } from "react-i18next";

interface SubpagesMenuProps {
  editor: Editor;
}

interface ShouldShowProps {
  from?: number;
  state: any;
  to?: number;
}

export const SubpagesMenu = React.memo(
  ({ editor }: SubpagesMenuProps): JSX.Element => {
    const { t } = useTranslation();

    const shouldShow = useCallback(
      ({ state }: ShouldShowProps) => {
        if (!state) {
          return false;
        }

        return editor.isActive("subpages");
      },
      [editor]
    );

    const getReferenceClientRect = useCallback(() => {
      if (!isEditorReady(editor)) {
        return new DOMRect();
      }
      const { selection } = editor.state;
      const predicate = (node: PMNode) => node.type.name === "subpages";
      const parent = findParentNode(predicate)(selection);

      if (parent) {
        const dom = editor.view.nodeDOM(parent?.pos) as HTMLElement;
        return dom.getBoundingClientRect();
      }

      return posToDOMRect(editor.view, selection.from, selection.to);
    }, [editor]);

    const deleteNode = useCallback(() => {
      const { selection } = editor.state;
      editor
        .chain()
        .focus()
        .setNodeSelection(selection.from)
        .deleteSelection()
        .run();
    }, [editor]);

    return (
      <BaseBubbleMenu
        editor={editor}
        pluginKey={"subpages-menu"}
        ref={(element) => {
          if (element) {
            element.style.zIndex = "99";
          }
        }}
        shouldShow={shouldShow}
        updateDelay={0}
      >
        <Tooltip label={t("Delete")} position="top">
          <ActionIcon
            aria-label={t("Delete")}
            color="red"
            onClick={deleteNode}
            size="lg"
            variant="default"
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Tooltip>
      </BaseBubbleMenu>
    );
  }
);

export default SubpagesMenu;
