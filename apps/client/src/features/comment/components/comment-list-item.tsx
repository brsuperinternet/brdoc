import { isEditorReady } from "@docmost/editor-ext";
import { Box, Group, Text } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import CommentActions from "@/features/comment/components/comment-actions";
import CommentEditor from "@/features/comment/components/comment-editor";
import CommentMenu from "@/features/comment/components/comment-menu";
import {
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from "@/features/comment/queries/comment-query";
import { IComment } from "@/features/comment/types/comment.types";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";
import { useTimeAgo } from "@/hooks/use-time-ago";
import classes from "./comment.module.css";

interface CommentListItemProps {
  comment: IComment;
  userSpaceRole?: string;
}

function CommentListItem({ comment, userSpaceRole }: CommentListItemProps) {
  const { t } = useTranslation();
  const { hovered, ref } = useHover();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const editor = useAtomValue(pageEditorAtom);
  const [content, setContent] = useState<string>(comment.content);
  const editContentRef = useRef<any>(null);
  const updateCommentMutation = useUpdateCommentMutation();
  const deleteCommentMutation = useDeleteCommentMutation(comment.pageId);

  const [currentUser] = useAtom(currentUserAtom);
  const createdAtAgo = useTimeAgo(comment.createdAt);

  useEffect(() => {
    setContent(comment.content);
  }, [comment]);

  async function handleUpdateComment() {
    try {
      setIsLoading(true);
      const commentToUpdate = {
        commentId: comment.id,
        content: JSON.stringify(editContentRef.current ?? content),
      };
      await updateCommentMutation.mutateAsync(commentToUpdate);
      if (editContentRef.current) {
        setContent(editContentRef.current);
        editContentRef.current = null;
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update comment:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteComment() {
    try {
      await deleteCommentMutation.mutateAsync(comment.id);
      if (isEditorReady(editor)) {
        editor.commands.unsetComment(comment.id);
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  }

  function handleCommentClick(comment: IComment) {
    const el = document.querySelector(
      `.comment-mark[data-comment-id="${comment.id}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("comment-highlight");
      setTimeout(() => {
        el.classList.remove("comment-highlight");
      }, 3000);
    }
  }

  function handleEditToggle() {
    setIsEditing(true);
  }
  function cancelEdit() {
    editContentRef.current = null;
    setIsEditing(false);
  }

  return (
    <Box pb="xs" ref={ref}>
      <Group>
        <CustomAvatar
          avatarUrl={comment.creator.avatarUrl}
          name={comment.creator.name}
          size="sm"
        />

        <div style={{ flex: 1 }}>
          <Group justify="space-between" wrap="nowrap">
            <Text fw={500} lineClamp={1} size="sm">
              {comment.creator.name}
            </Text>

            <div style={{ visibility: hovered ? "visible" : "hidden" }}>
              {(currentUser?.user?.id === comment.creatorId ||
                userSpaceRole === "admin") && (
                <CommentMenu
                  canEdit={currentUser?.user?.id === comment.creatorId}
                  onDeleteComment={handleDeleteComment}
                  onEditComment={handleEditToggle}
                />
              )}
            </div>
          </Group>

          <Group gap="xs">
            <Text c="dimmed" fw={500} size="xs">
              {createdAtAgo}
            </Text>
          </Group>
        </div>
      </Group>

      <div>
        {!comment.parentCommentId && comment.selection && (
          <Box
            aria-label={t("Jump to comment selection")}
            className={classes.textSelection}
            onClick={() => handleCommentClick(comment)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCommentClick(comment);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <Text size="sm">{comment.selection}</Text>
          </Box>
        )}

        {isEditing ? (
          <>
            <CommentEditor
              autofocus={true}
              defaultContent={content}
              editable={true}
              onSave={handleUpdateComment}
              onUpdate={(newContent: any) => {
                editContentRef.current = newContent;
              }}
            />

            <CommentActions
              isCommentEditor={true}
              isLoading={isLoading}
              onCancel={cancelEdit}
              onSave={handleUpdateComment}
            />
          </>
        ) : (
          <CommentEditor defaultContent={content} editable={false} />
        )}
      </div>
    </Box>
  );
}

export default CommentListItem;
