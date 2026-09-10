import { LinkExtension, Mention } from "@docmost/editor-ext";
import { useFocusWithin } from "@mantine/hooks";
import { Placeholder } from "@tiptap/extension-placeholder";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import clsx from "clsx";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useTranslation } from "react-i18next";
import mentionRenderItems from "@/features/editor/components/mention/mention-suggestion";
import MentionView from "@/features/editor/components/mention/mention-view";
import EmojiCommand from "@/features/editor/extensions/emoji-command";
import { platformModifierKey } from "@/lib";
import classes from "./comment.module.css";

interface CommentEditorProps {
  autofocus?: boolean;
  defaultContent?: any;
  editable: boolean;
  onSave?: any;
  onUpdate?: any;
  placeholder?: string;
  surface?: "default" | "muted";
}

const CommentEditor = forwardRef(
  (
    {
      defaultContent,
      onUpdate,
      onSave,
      editable,
      placeholder,
      autofocus,
      surface,
    }: CommentEditorProps,
    ref
  ) => {
    const { t } = useTranslation();
    const { ref: focusRef, focused } = useFocusWithin();

    const commentEditor = useEditor({
      autofocus: autofocus && "end",
      content: defaultContent,
      editable,
      editorProps: {
        attributes: {
          "aria-label": placeholder || t("Comment"),
        },
        handleDOMEvents: {
          keydown: (_view, event) => {
            if (
              [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "Enter",
              ].includes(event.key)
            ) {
              const emojiCommand = document.querySelector("#emoji-command");
              const mentionPopup = document.querySelector("#mention");
              if (emojiCommand || mentionPopup) {
                return true;
              }
            }

            if (platformModifierKey(event) && event.code === "Enter") {
              event.preventDefault();
              if (onSave) {
                onSave();
              }

              return true;
            }
          },
        },
      },
      extensions: [
        StarterKit.configure({
          dropcursor: false,
          gapcursor: false,
          link: false,
        }),
        Placeholder.configure({
          placeholder: placeholder || t("Reply..."),
        }),
        LinkExtension,
        EmojiCommand,
        Mention.configure({
          HTMLAttributes: {
            class: "mention",
          },
          suggestion: {
            allowSpaces: true,
            items: () => [],
            // @ts-expect-error
            render: mentionRenderItems,
          },
        }).extend({
          addNodeView() {
            this.editor.isInitialized = true;
            return ReactNodeViewRenderer(MentionView);
          },
        }),
      ],
      immediatelyRender: true,
      onUpdate({ editor }) {
        if (onUpdate) {
          onUpdate(editor.getJSON());
        }
      },
      shouldRerenderOnTransaction: false,
      textDirection: "auto",
    });

    // Sync content from props for read-only editors (e.g. when updated via
    // websocket on another browser). Skip for editable editors to avoid
    // resetting the cursor position on every keystroke.
    useEffect(() => {
      if (
        !editable &&
        commentEditor &&
        !commentEditor.isDestroyed &&
        defaultContent
      ) {
        commentEditor.commands.setContent(defaultContent);
      }
    }, [defaultContent, editable, commentEditor]);

    useEffect(() => {
      setTimeout(() => {
        if (autofocus && commentEditor && !commentEditor.isDestroyed) {
          commentEditor.commands.focus("end");
        }
      }, 10);
    }, [commentEditor, autofocus]);

    useImperativeHandle(ref, () => ({
      clearContent: () => {
        if (commentEditor && !commentEditor.isDestroyed) {
          commentEditor.commands.clearContent();
        }
      },
    }));

    return (
      <div
        className={classes.commentEditor}
        data-editable={editable || undefined}
        data-surface={surface}
        ref={focusRef}
      >
        <EditorContent
          className={clsx(classes.ProseMirror, { [classes.focused]: focused })}
          editor={commentEditor}
        />
      </div>
    );
  }
);

export default CommentEditor;
