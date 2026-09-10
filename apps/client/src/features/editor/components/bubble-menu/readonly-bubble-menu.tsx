import { isEditorReady } from "@docmost/editor-ext";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconMessage } from "@tabler/icons-react";
import { TextSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { getRelativeSelection, ySyncPluginKey } from "@tiptap/y-tiptap";
import { useAtom } from "jotai";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  readOnlyCommentDataAtom,
  showReadOnlyCommentPopupAtom,
} from "@/features/comment/atoms/comment-atom";
import classes from "./bubble-menu.module.css";

type ReadonlyBubbleMenuProps = {
  editor: Editor;
};

export const ReadonlyBubbleMenu: FC<ReadonlyBubbleMenuProps> = ({ editor }) => {
  const { t } = useTranslation();
  const [showReadOnlyCommentPopup, setShowReadOnlyCommentPopup] = useAtom(
    showReadOnlyCommentPopupAtom
  );
  const [, setReadOnlyCommentData] = useAtom(readOnlyCommentDataAtom);
  const menuRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const isInteractingRef = useRef(false);

  const updateMenuPosition = useCallback(() => {
    if (isInteractingRef.current) {
      return;
    }
    if (!isEditorReady(editor)) {
      setVisible(false);
      return;
    }

    const pmSelection = editor.state.selection;
    if (!(pmSelection instanceof TextSelection) || pmSelection.empty) {
      setVisible(false);
      return;
    }

    const selection = window.getSelection();
    if (
      !selection ||
      selection.isCollapsed ||
      selection.rangeCount === 0 ||
      showReadOnlyCommentPopup
    ) {
      setVisible(false);
      return;
    }

    const editorDom = editor.view.dom;
    if (
      !(
        editorDom.contains(selection.anchorNode) &&
        editorDom.contains(selection.focusNode)
      )
    ) {
      setVisible(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0) {
      setVisible(false);
      return;
    }

    const editorRect = editorDom
      .closest(".editor-container")
      ?.getBoundingClientRect();
    if (!editorRect) {
      setVisible(false);
      return;
    }

    setPosition({
      left: rect.left - editorRect.left + rect.width / 2,
      top: rect.top - editorRect.top - 44,
    });
    setVisible(true);
  }, [editor, showReadOnlyCommentPopup]);

  useEffect(() => {
    const handleSelectionChange = () => {
      updateMenuPosition();
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateMenuPosition]);

  useEffect(() => {
    if (showReadOnlyCommentPopup) {
      setVisible(false);
    }
  }, [showReadOnlyCommentPopup]);

  const handleCommentClick = () => {
    if (!isEditorReady(editor)) {
      return;
    }

    const view = editor.view;
    const ystate = ySyncPluginKey.getState(view.state);

    if (ystate?.binding) {
      const selection = getRelativeSelection(ystate.binding, view.state);
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);

      // @ts-expect-error
      setReadOnlyCommentData({
        selectedText,
        yjsSelection: {
          anchor: selection.anchor,
          head: selection.head,
        },
      });

      setShowReadOnlyCommentPopup(true);
      setVisible(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      style={{
        left: position.left,
        position: "absolute",
        top: position.top,
        transform: "translateX(-50%)",
        zIndex: 199,
      }}
    >
      <div className={classes.bubbleMenu}>
        <Tooltip label={t("Comment")} withArrow withinPortal={false}>
          <ActionIcon
            aria-label={t("Comment")}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isInteractingRef.current = true;
              handleCommentClick();
              isInteractingRef.current = false;
            }}
            radius="6px"
            size="lg"
            style={{ border: "none" }}
            variant="default"
          >
            <IconMessage size={16} stroke={2} />
          </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
};
