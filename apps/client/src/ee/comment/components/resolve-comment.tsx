import { isEditorReady } from "@docmost/editor-ext";
import { ActionIcon, Tooltip } from "@mantine/core";
import { IconCircleCheck, IconCircleCheckFilled } from "@tabler/icons-react";
import { Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import { useResolveCommentMutation } from "@/ee/comment/queries/comment-query";

interface ResolveCommentProps {
  commentId: string;
  editor: Editor;
  pageId: string;
  resolvedAt?: Date;
}

function ResolveComment({
  editor,
  commentId,
  pageId,
  resolvedAt,
}: ResolveCommentProps) {
  const { t } = useTranslation();
  const resolveCommentMutation = useResolveCommentMutation();

  const isResolved = resolvedAt != null;
  const iconColor = isResolved ? "green" : "gray";

  const handleResolveToggle = async () => {
    try {
      await resolveCommentMutation.mutateAsync({
        commentId,
        pageId,
        resolved: !isResolved,
      });

      if (isEditorReady(editor)) {
        editor.commands.setCommentResolved(commentId, !isResolved);
      }

      //
    } catch (error) {
      console.error("Failed to toggle resolved state:", error);
    }
  };

  return (
    <Tooltip
      label={isResolved ? t("Re-Open comment") : t("Resolve comment")}
      position="top"
    >
      <ActionIcon
        color={isResolved ? "green" : "gray"}
        disabled={resolveCommentMutation.isPending}
        loading={resolveCommentMutation.isPending}
        onClick={handleResolveToggle}
        size="sm"
        variant="subtle"
      >
        {isResolved ? (
          <IconCircleCheckFilled size={18} />
        ) : (
          <IconCircleCheck size={18} />
        )}
      </ActionIcon>
    </Tooltip>
  );
}

export default ResolveComment;
