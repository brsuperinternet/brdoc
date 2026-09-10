import { isEditorReady } from "@docmost/editor-ext";
import { ActionIcon, Tooltip } from "@mantine/core";
import {
  IconDownload,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignRight,
  IconRefresh,
  IconTrash,
  IconZoomIn,
} from "@tabler/icons-react";
import { Node as PMNode } from "@tiptap/pm/model";
import { findParentNode, posToDOMRect, useEditorState } from "@tiptap/react";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react/menus";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import React, { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { lightboxRequestAtom } from "@/features/editor/atoms/editor-atoms";
import { useAltTextControl } from "@/features/editor/components/common/use-alt-text-control.tsx";
import { uploadImageAction } from "@/features/editor/components/image/upload-image-action.tsx";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import { getFileUrl } from "@/lib/config.ts";
import classes from "../common/toolbar-menu.module.css";

export function ImageMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setLightboxRequest = useSetAtom(lightboxRequestAtom);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      const imageAttrs = ctx.editor.getAttributes("image");

      return {
        alt: imageAttrs?.alt || "",
        isAlignCenter: ctx.editor.isActive("image", { align: "center" }),
        isAlignLeft: ctx.editor.isActive("image", { align: "left" }),
        isAlignRight: ctx.editor.isActive("image", { align: "right" }),
        isImage: ctx.editor.isActive("image"),
        src: imageAttrs?.src || null,
      };
    },
  });

  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!state) {
        return false;
      }

      return editor.isActive("image") && editor.getAttributes("image").src;
    },
    [editor]
  );

  const getReferencedVirtualElement = useCallback(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "image";
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

  const alignImageLeft = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setImageAlign("left")
      .run();
  }, [editor]);

  const alignImageCenter = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setImageAlign("center")
      .run();
  }, [editor]);

  const alignImageRight = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setImageAlign("right")
      .run();
  }, [editor]);

  const handleDownload = useCallback(() => {
    if (!editorState?.src) {
      return;
    }
    const url = getFileUrl(editorState.src);
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.click();
  }, [editorState?.src]);

  const handleReplace = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      // @ts-expect-error
      const pageId = editor.storage?.pageId;
      if (pageId) {
        const pos = editor.state.selection.from;
        uploadImageAction(file, editor, pos, pageId);
      }
      // Reset so the same file can be selected again
      e.target.value = "";
    },
    [editor]
  );

  const handleDelete = useCallback(() => {
    editor.commands.deleteSelection();
  }, [editor]);

  const {
    button: altTextButton,
    panel: altTextPanel,
    isEditing: isEditingAlt,
  } = useAltTextControl({
    currentAlt: editorState?.alt || "",
    editor,
    nodeName: "image",
  });

  return (
    <BaseBubbleMenu
      editor={editor}
      getReferencedVirtualElement={getReferencedVirtualElement}
      options={{
        flip: false,
        offset: 8,
        placement: "top",
      }}
      pluginKey={"image-menu"}
      ref={(element) => {
        if (element) {
          element.style.zIndex = "99";
        }
      }}
      shouldShow={shouldShow}
      updateDelay={0}
    >
      {isEditingAlt ? (
        altTextPanel
      ) : (
        <div className={classes.toolbar}>
          <Tooltip label={t("Align left")} position="top" withinPortal={false}>
            <ActionIcon
              aria-label={t("Align left")}
              className={clsx({ [classes.active]: editorState?.isAlignLeft })}
              onClick={alignImageLeft}
              size="lg"
              variant="subtle"
            >
              <IconLayoutAlignLeft size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={t("Align center")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Align center")}
              className={clsx({ [classes.active]: editorState?.isAlignCenter })}
              onClick={alignImageCenter}
              size="lg"
              variant="subtle"
            >
              <IconLayoutAlignCenter size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t("Align right")} position="top" withinPortal={false}>
            <ActionIcon
              aria-label={t("Align right")}
              className={clsx({ [classes.active]: editorState?.isAlignRight })}
              onClick={alignImageRight}
              size="lg"
              variant="subtle"
            >
              <IconLayoutAlignRight size={18} />
            </ActionIcon>
          </Tooltip>

          <div className={classes.divider} />

          {altTextButton}

          <div className={classes.divider} />

          <Tooltip label={t("Expand")} position="top" withinPortal={false}>
            <ActionIcon
              aria-label={t("Expand")}
              onClick={() =>
                editorState?.src &&
                setLightboxRequest({
                  src: getFileUrl(editorState.src),
                  type: "image",
                })
              }
              size="lg"
              variant="subtle"
            >
              <IconZoomIn size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t("Download")} position="top" withinPortal={false}>
            <ActionIcon
              aria-label={t("Download")}
              onClick={handleDownload}
              size="lg"
              variant="subtle"
            >
              <IconDownload size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={t("Replace image")}
            position="top"
            withinPortal={false}
          >
            <ActionIcon
              aria-label={t("Replace image")}
              onClick={handleReplace}
              size="lg"
              variant="subtle"
            >
              <IconRefresh size={18} />
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
      )}

      <input
        accept="image/*"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: "none" }}
        type="file"
      />
    </BaseBubbleMenu>
  );
}

export default ImageMenu;
