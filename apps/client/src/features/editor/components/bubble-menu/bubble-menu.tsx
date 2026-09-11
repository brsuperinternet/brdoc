import {
  isCellSelection,
  isEditorReady,
  isTextSelected,
} from "@docmost/editor-ext";
import { ActionIcon, rem, Tooltip } from "@mantine/core";
import {
  IconBold,
  IconCode,
  IconItalic,
  IconMessage,
  IconStrikethrough,
  IconUnderline,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { isNodeSelection, useEditorState } from "@tiptap/react";
import { BubbleMenu, BubbleMenuProps } from "@tiptap/react/menus";
import clsx from "clsx";
import { useAtom, useAtomValue } from "jotai";
import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v7 as uuid7 } from "uuid";
import {
  draftCommentIdAtom,
  showCommentPopupAtom,
} from "@/features/comment/atoms/comment-atom";
import { showLinkMenuAtom } from "@/features/editor/atoms/editor-atoms";
import { LinkSelector } from "@/features/editor/components/bubble-menu/link-selector.tsx";
import { userAtom } from "@/features/user/atoms/current-user-atom";
import classes from "./bubble-menu.module.css";
import { ColorSelector } from "./color-selector";
import { NodeSelector } from "./node-selector";
import { TextAlignmentSelector } from "./text-alignment-selector";

export interface BubbleMenuItem {
  command: () => void;
  icon: typeof IconBold;
  isActive: () => boolean;
  name: string;
}

type EditorBubbleMenuProps = Omit<BubbleMenuProps, "children" | "editor"> & {
  editor: Editor | null;
  templateMode?: boolean;
};

export const EditorBubbleMenu: FC<EditorBubbleMenuProps> = (props) => {
  const { templateMode = false } = props;
  const { t } = useTranslation();

  const [showCommentPopup, setShowCommentPopup] = useAtom(showCommentPopupAtom);

  const user = useAtomValue(userAtom);
  const editorToolbarEnabled =
    user?.settings?.preferences?.editorToolbar ?? false;
  const [, setDraftCommentId] = useAtom(draftCommentIdAtom);
  const showCommentPopupRef = useRef(showCommentPopup);

  const [showLinkMenu] = useAtom(showLinkMenuAtom);
  const showLinkMenuRef = useRef(showLinkMenu);

  useEffect(() => {
    showCommentPopupRef.current = showCommentPopup;
  }, [showCommentPopup]);

  useEffect(() => {
    showLinkMenuRef.current = showLinkMenu;
  }, [showLinkMenu]);

  const editorState = useEditorState({
    editor: props.editor,
    selector: (ctx) => {
      if (!props.editor) {
        return null;
      }

      return {
        isBold: ctx.editor.isActive("bold"),
        isCode: ctx.editor.isActive("code"),
        isComment: ctx.editor.isActive("comment"),
        isItalic: ctx.editor.isActive("italic"),
        isStrike: ctx.editor.isActive("strike"),
        isUnderline: ctx.editor.isActive("underline"),
      };
    },
  });

  const items: BubbleMenuItem[] = [
    {
      command: () => props.editor.chain().focus().toggleBold().run(),
      icon: IconBold,
      isActive: () => editorState?.isBold,
      name: "Bold",
    },
    {
      command: () => props.editor.chain().focus().toggleItalic().run(),
      icon: IconItalic,
      isActive: () => editorState?.isItalic,
      name: "Italic",
    },
    {
      command: () => props.editor.chain().focus().toggleUnderline().run(),
      icon: IconUnderline,
      isActive: () => editorState?.isUnderline,
      name: "Underline",
    },
    {
      command: () => props.editor.chain().focus().toggleStrike().run(),
      icon: IconStrikethrough,
      isActive: () => editorState?.isStrike,
      name: "Strike",
    },
    {
      command: () => props.editor.chain().focus().toggleCode().run(),
      icon: IconCode,
      isActive: () => editorState?.isCode,
      name: "Code",
    },
  ];

  const commentItem: BubbleMenuItem = {
    command: () => {
      const commentId = uuid7();

      props.editor.chain().focus().setCommentDecoration().run();
      setDraftCommentId(commentId);
      setShowCommentPopup(true);
    },
    icon: IconMessage,
    isActive: () => editorState?.isComment,
    name: "Comment",
  };

  const bubbleMenuProps: EditorBubbleMenuProps = {
    ...props,
    options: {
      offset: 8,
      onHide: () => {
        setIsNodeSelectorOpen(false);
        setIsTextAlignmentOpen(false);
        setIsColorSelectorOpen(false);
      },
      placement: editorToolbarEnabled ? "bottom" : "top",
    },
    shouldShow: ({ state, editor }) => {
      const { selection } = state;
      const { empty } = selection;

      if (
        !editor.isEditable ||
        editor.isActive("image") ||
        empty ||
        isNodeSelection(selection) ||
        isCellSelection(selection) ||
        showLinkMenuRef.current ||
        showCommentPopupRef.current
      ) {
        return false;
      }
      return isTextSelected(editor);
    },
  };

  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const [isTextAlignmentSelectorOpen, setIsTextAlignmentOpen] = useState(false);
  const [isColorSelectorOpen, setIsColorSelectorOpen] = useState(false);

  // Hide the bubble menu immediately when AI menu is shown
  if (showLinkMenu) {
    return;
  }

  return (
    <BubbleMenu
      {...bubbleMenuProps}
      style={{ position: "relative", zIndex: 199 }}
    >
      <div className={classes.bubbleMenu}>
        {!editorToolbarEnabled && (
          <>
            <NodeSelector
              editor={props.editor}
              isOpen={isNodeSelectorOpen}
              setIsOpen={() => {
                setIsNodeSelectorOpen(!isNodeSelectorOpen);
                setIsTextAlignmentOpen(false);
                setIsColorSelectorOpen(false);
              }}
            />

            <TextAlignmentSelector
              editor={props.editor}
              isOpen={isTextAlignmentSelectorOpen}
              setIsOpen={() => {
                setIsTextAlignmentOpen(!isTextAlignmentSelectorOpen);
                setIsNodeSelectorOpen(false);
                setIsColorSelectorOpen(false);
              }}
            />

            <ActionIcon.Group>
              {items.map((item, index) => (
                <Tooltip
                  key={index}
                  label={t(item.name)}
                  withArrow
                  withinPortal={false}
                >
                  <ActionIcon
                    aria-label={t(item.name)}
                    className={clsx({ [classes.active]: item.isActive() })}
                    key={index}
                    onClick={() =>
                      isEditorReady(props.editor) && item.command()
                    }
                    radius="0"
                    size="lg"
                    style={{ border: "none" }}
                    variant="default"
                  >
                    <item.icon stroke={2} style={{ width: rem(16) }} />
                  </ActionIcon>
                </Tooltip>
              ))}
            </ActionIcon.Group>

            <ColorSelector
              editor={props.editor}
              isOpen={isColorSelectorOpen}
              setIsOpen={() => {
                setIsColorSelectorOpen(!isColorSelectorOpen);
                setIsNodeSelectorOpen(false);
                setIsTextAlignmentOpen(false);
              }}
            />
          </>
        )}

        <LinkSelector />

        {!templateMode && (
          <Tooltip label={t(commentItem.name)} withArrow withinPortal={false}>
            <ActionIcon
              aria-label={t(commentItem.name)}
              onClick={() =>
                isEditorReady(props.editor) && commentItem.command()
              }
              radius="6px"
              size="lg"
              style={{ border: "none" }}
              variant="default"
            >
              <IconMessage size={16} stroke={2} />
            </ActionIcon>
          </Tooltip>
        )}
      </div>
    </BubbleMenu>
  );
};
