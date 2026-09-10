import { isEditorReady } from "@docmost/editor-ext";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconPaperclip, IconTrash } from "@tabler/icons-react";
import { Node as PMNode } from "@tiptap/pm/model";
import { findParentNode, posToDOMRect, useEditorState } from "@tiptap/react";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react/menus";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import classes from "../common/toolbar-menu.module.css";

export function PdfMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      const pdfAttrs = ctx.editor.getAttributes("pdf");

      return {
        attachmentId: pdfAttrs?.attachmentId || null,
        isPdf: ctx.editor.isActive("pdf"),
        name: pdfAttrs?.name || null,
        src: pdfAttrs?.src || null,
      };
    },
  });

  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!(state && isEditorReady(editor))) {
        return false;
      }
      if (!editor.isActive("pdf")) {
        return false;
      }

      const { selection } = state;
      const dom = editor.view.nodeDOM(selection.from) as HTMLElement | null;
      if (!dom) {
        return false;
      }

      return !!dom.querySelector("[data-pdf-error]");
    },
    [editor]
  );

  const getReferencedVirtualElement = useCallback(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "pdf";
    const parent = findParentNode(predicate)(selection);

    if (parent) {
      const dom = editor.view.nodeDOM(parent?.pos) as HTMLElement;
      const domRect = dom.getBoundingClientRect();
      return {
        getBoundingClientRect: () => domRect,
        getClientRects: () => [domRect],
      };
    }

    const domRect = posToDOMRect(editor.view, selection.from, selection.to);
    return {
      getBoundingClientRect: () => domRect,
      getClientRects: () => [domRect],
    };
  }, [editor]);

  const handleConvertToAttachment = useCallback(() => {
    if (!editorState?.src) {
      return;
    }

    const { selection } = editor.state;
    const { from } = selection;
    const node = editor.state.doc.nodeAt(from);
    if (!node || node.type.name !== "pdf") {
      return;
    }

    editor
      .chain()
      .insertContentAt(
        { from, to: from + node.nodeSize },
        {
          attrs: {
            attachmentId: node.attrs.attachmentId,
            mime: "application/pdf",
            name: node.attrs.name,
            size: node.attrs.size,
            url: node.attrs.src,
          },
          type: "attachment",
        }
      )
      .run();
  }, [editor, editorState]);

  const handleDelete = useCallback(() => {
    editor.commands.deleteSelection();
  }, [editor]);

  return (
    <BaseBubbleMenu
      editor={editor}
      getReferencedVirtualElement={getReferencedVirtualElement}
      options={{
        flip: false,
        offset: 8,
        placement: "top",
      }}
      pluginKey={"pdf-menu"}
      ref={(element) => {
        if (element) {
          element.style.zIndex = "99";
        }
      }}
      shouldShow={shouldShow}
      updateDelay={0}
    >
      <div className={classes.toolbar}>
        <Tooltip
          label={t("Convert to attachment")}
          position="top"
          withinPortal={false}
        >
          <ActionIcon
            aria-label={t("Convert to attachment")}
            onClick={handleConvertToAttachment}
            size="lg"
            variant="subtle"
          >
            <IconPaperclip size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={t("Delete")} position="top" withinPortal={false}>
          <ActionIcon
            aria-label={t("Delete")}
            onClick={handleDelete}
            size="lg"
            variant="subtle"
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
    </BaseBubbleMenu>
  );
}

export default PdfMenu;
