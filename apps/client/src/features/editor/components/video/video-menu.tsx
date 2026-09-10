import { isEditorReady } from "@docmost/editor-ext";
import { ActionIcon, Tooltip } from "@mantine/core";
import {
  IconDownload,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignRight,
  IconTrash,
  IconZoomIn,
} from "@tabler/icons-react";
import { Node as PMNode } from "@tiptap/pm/model";
import { findParentNode, posToDOMRect, useEditorState } from "@tiptap/react";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react/menus";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { lightboxRequestAtom } from "@/features/editor/atoms/editor-atoms";
import { useAltTextControl } from "@/features/editor/components/common/use-alt-text-control.tsx";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import { getFileUrl } from "@/lib/config.ts";
import classes from "../common/toolbar-menu.module.css";

export function VideoMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();
  const setLightboxRequest = useSetAtom(lightboxRequestAtom);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      const videoAttrs = ctx.editor.getAttributes("video");

      return {
        alt: videoAttrs?.alt || "",
        isAlignCenter: ctx.editor.isActive("video", { align: "center" }),
        isAlignLeft: ctx.editor.isActive("video", { align: "left" }),
        isAlignRight: ctx.editor.isActive("video", { align: "right" }),
        isVideo: ctx.editor.isActive("video"),
        src: videoAttrs?.src || null,
      };
    },
  });

  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!state) {
        return false;
      }

      return editor.isActive("video") && editor.getAttributes("video").src;
    },
    [editor]
  );

  const getReferencedVirtualElement = useCallback(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "video";
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

  const alignLeft = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setVideoAlign("left")
      .run();
  }, [editor]);

  const alignCenter = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setVideoAlign("center")
      .run();
  }, [editor]);

  const alignRight = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setVideoAlign("right")
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
    nodeName: "video",
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
      pluginKey={"video-menu"}
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
              onClick={alignLeft}
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
              onClick={alignCenter}
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
              onClick={alignRight}
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
                  type: "video",
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
    </BaseBubbleMenu>
  );
}

export default VideoMenu;
