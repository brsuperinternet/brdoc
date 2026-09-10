import {
  CalloutType,
  isEditorReady,
  isTextSelected,
} from "@docmost/editor-ext";
import { ActionIcon, Tooltip } from "@mantine/core";
import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconInfoCircleFilled,
  IconMoodSmile,
  IconNotes,
} from "@tabler/icons-react";
import { Node as PMNode } from "@tiptap/pm/model";
import { findParentNode, posToDOMRect, useEditorState } from "@tiptap/react";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react/menus";
import clsx from "clsx";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import EmojiPicker from "@/components/ui/emoji-picker.tsx";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import classes from "../common/toolbar-menu.module.css";

export function CalloutMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();

  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!state) {
        return false;
      }
      if (isTextSelected(editor)) {
        return false;
      }

      return editor.isActive("callout");
    },
    [editor]
  );

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      return {
        isCallout: ctx.editor.isActive("callout"),
        isDanger: ctx.editor.isActive("callout", { type: "danger" }),
        isInfo: ctx.editor.isActive("callout", { type: "info" }),
        isNote: ctx.editor.isActive("callout", { type: "note" }),
        isSuccess: ctx.editor.isActive("callout", { type: "success" }),
        isWarning: ctx.editor.isActive("callout", { type: "warning" }),
      };
    },
  });

  const getReferencedVirtualElement = useCallback(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "callout";
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

  const setCalloutType = useCallback(
    (calloutType: CalloutType) => {
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .updateCalloutType(calloutType)
        .run();
    },
    [editor]
  );

  const setCalloutIcon = useCallback(
    (emoji: any) => {
      const emojiChar = emoji?.native || emoji?.emoji || emoji;
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .updateCalloutIcon(emojiChar)
        .run();
    },
    [editor]
  );

  const removeCalloutIcon = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .updateCalloutIcon("")
      .run();
  }, [editor]);

  const getCurrentIcon = () => {
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "callout";
    const parent = findParentNode(predicate)(selection);
    const icon = parent?.node.attrs.icon;
    return icon || null;
  };

  const currentIcon = getCurrentIcon();

  return (
    <BaseBubbleMenu
      editor={editor}
      getReferencedVirtualElement={getReferencedVirtualElement}
      options={{
        // offset: 233, //      //         offset: [0, 10],
        flip: false,
        placement: "bottom",
      }}
      pluginKey={"callout-menu"}
      ref={(element) => {
        if (element) {
          element.style.zIndex = "99";
        }
      }}
      shouldShow={shouldShow}
      updateDelay={0}
    >
      <div className={classes.toolbar}>
        <Tooltip label={t("Info")} position="top" withinPortal={false}>
          <ActionIcon
            aria-label={t("Info")}
            className={clsx({ [classes.active]: editorState?.isInfo })}
            onClick={() => setCalloutType("info")}
            size="lg"
            variant="subtle"
          >
            <IconInfoCircleFilled
              color="var(--mantine-color-blue-5)"
              size={18}
            />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={t("Note")} position="top" withinPortal={false}>
          <ActionIcon
            aria-label={t("Note")}
            className={clsx({ [classes.active]: editorState?.isNote })}
            onClick={() => setCalloutType("note")}
            size="lg"
            variant="subtle"
          >
            <IconNotes color="var(--mantine-color-grape-5)" size={18} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={t("Success")} position="top" withinPortal={false}>
          <ActionIcon
            aria-label={t("Success")}
            className={clsx({ [classes.active]: editorState?.isSuccess })}
            onClick={() => setCalloutType("success")}
            size="lg"
            variant="subtle"
          >
            <IconCircleCheckFilled
              color="var(--mantine-color-green-5)"
              size={18}
            />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={t("Warning")} position="top" withinPortal={false}>
          <ActionIcon
            aria-label={t("Warning")}
            className={clsx({ [classes.active]: editorState?.isWarning })}
            onClick={() => setCalloutType("warning")}
            size="lg"
            variant="subtle"
          >
            <IconAlertTriangleFilled
              color="var(--mantine-color-orange-5)"
              size={18}
            />
          </ActionIcon>
        </Tooltip>

        <Tooltip label={t("Danger")} position="top" withinPortal={false}>
          <ActionIcon
            aria-label={t("Danger")}
            className={clsx({ [classes.active]: editorState?.isDanger })}
            onClick={() => setCalloutType("danger")}
            size="lg"
            variant="subtle"
          >
            <IconCircleXFilled color="var(--mantine-color-red-5)" size={18} />
          </ActionIcon>
        </Tooltip>

        <EmojiPicker
          actionIconProps={{
            size: "lg",
            variant: "subtle",
          }}
          icon={currentIcon || <IconMoodSmile size={18} />}
          onEmojiSelect={setCalloutIcon}
          readOnly={false}
          removeEmojiAction={removeCalloutIcon}
        />
      </div>
    </BaseBubbleMenu>
  );
}

export default CalloutMenu;
