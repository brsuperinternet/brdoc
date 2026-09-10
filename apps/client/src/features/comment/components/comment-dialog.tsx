import { isEditorReady } from "@docmost/editor-ext";
import { Dialog, Group, Stack, Text } from "@mantine/core";
import { useClickOutside } from "@mantine/hooks";
import { useEditor } from "@tiptap/react";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { asideStateAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import {
  activeCommentIdAtom,
  draftCommentIdAtom,
  readOnlyCommentDataAtom,
  showCommentPopupAtom,
  showReadOnlyCommentPopupAtom,
} from "@/features/comment/atoms/comment-atom";
import CommentActions from "@/features/comment/components/comment-actions";
import CommentEditor from "@/features/comment/components/comment-editor";
import { useCreateCommentMutation } from "@/features/comment/queries/comment-query";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";

interface CommentDialogProps {
  editor: ReturnType<typeof useEditor>;
  pageId: string;
  readOnly?: boolean;
}

function CommentDialog({ editor, pageId, readOnly }: CommentDialogProps) {
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const [, setShowCommentPopup] = useAtom(showCommentPopupAtom);
  const [, setShowReadOnlyCommentPopup] = useAtom(showReadOnlyCommentPopupAtom);
  const [readOnlyCommentData, setReadOnlyCommentData] = useAtom(
    readOnlyCommentDataAtom
  );
  const [, setActiveCommentId] = useAtom(activeCommentIdAtom);
  const [draftCommentId, setDraftCommentId] = useAtom(draftCommentIdAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const [, setAsideState] = useAtom(asideStateAtom);
  const useClickOutsideRef = useClickOutside(() => {
    if (document.querySelector("#mention")) {
      return;
    }
    handleDialogClose();
  });
  const createCommentMutation = useCreateCommentMutation();
  const isPending = createCommentMutation.isPending;

  const handleDialogClose = () => {
    if (readOnly) {
      setShowReadOnlyCommentPopup(false);
      // @ts-expect-error
      setReadOnlyCommentData(null);
    } else {
      setShowCommentPopup(false);
      if (isEditorReady(editor)) {
        editor.chain().focus().unsetCommentDecoration().run();
      }
    }
  };

  const getSelectedText = () => {
    if (!isEditorReady(editor)) {
      return "";
    }
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to);
  };

  const handleAddComment = async () => {
    if (readOnly) {
      await handleAddReadOnlyComment();
      return;
    }

    try {
      const selectedText = getSelectedText();
      const commentData = {
        content: JSON.stringify(comment),
        pageId,
        selection: selectedText,
        type: "inline",
      };

      const createdComment =
        await createCommentMutation.mutateAsync(commentData);
      if (isEditorReady(editor)) {
        editor
          .chain()
          .setComment(createdComment.id)
          .unsetCommentDecoration()
          .run();
        editor.commands.setTextSelection({
          from: editor.view.state.selection.from,
          to: editor.view.state.selection.from,
        });
      }
      setActiveCommentId(createdComment.id);

      setAsideState({ isAsideOpen: true, tab: "comments" });
      setTimeout(() => {
        const selector = `div[data-comment-id="${createdComment.id}"]`;
        const commentElement = document.querySelector(selector);
        commentElement?.scrollIntoView({ behavior: "smooth", block: "center" });

        if (isEditorReady(editor)) {
          editor.view.dispatch(editor.state.tr.scrollIntoView());
        }
      }, 400);
    } finally {
      setShowCommentPopup(false);
      setDraftCommentId("");
    }
  };

  const handleAddReadOnlyComment = async () => {
    if (!readOnlyCommentData) {
      return;
    }

    try {
      const createdComment = await createCommentMutation.mutateAsync({
        content: JSON.stringify(comment),
        pageId,
        selection: readOnlyCommentData.selectedText,
        type: "inline",
        yjsSelection: readOnlyCommentData.yjsSelection,
      });

      setActiveCommentId(createdComment.id);
      setAsideState({ isAsideOpen: true, tab: "comments" });

      setTimeout(() => {
        const selector = `div[data-comment-id="${createdComment.id}"]`;
        const commentElement = document.querySelector(selector);
        commentElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    } finally {
      setShowReadOnlyCommentPopup(false);
      // @ts-expect-error
      setReadOnlyCommentData(null);
    }
  };

  const handleCommentEditorChange = (newContent: any) => {
    setComment(newContent);
  };

  return (
    <Dialog
      aria-label={t("Add comment")}
      data-comment-dialog
      onClose={handleDialogClose}
      opened={true}
      position={{ bottom: 500, right: 50 }}
      radius="md"
      ref={useClickOutsideRef}
      size="lg"
      w={300}
      withBorder
      withCloseButton
      zIndex={180}
    >
      <Stack gap={2}>
        <Group>
          <CustomAvatar
            avatarUrl={currentUser.user.avatarUrl}
            name={currentUser.user.name}
            size="sm"
          />
          <div style={{ flex: 1 }}>
            <Group justify="space-between" wrap="nowrap">
              <Text fw={500} lineClamp={1} size="sm">
                {currentUser.user.name}
              </Text>
            </Group>
          </div>
        </Group>

        <CommentEditor
          autofocus={true}
          editable={true}
          onSave={handleAddComment}
          onUpdate={handleCommentEditorChange}
          placeholder={t("Write a comment")}
        />
        <CommentActions isLoading={isPending} onSave={handleAddComment} />
      </Stack>
    </Dialog>
  );
}

export default CommentDialog;
