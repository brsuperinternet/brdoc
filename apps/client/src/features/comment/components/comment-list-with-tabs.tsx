import {
  ActionIcon,
  Badge,
  Center,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { useFocusWithin } from "@mantine/hooks";
import { IconArrowUp, IconMessageOff } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import CommentActions from "@/features/comment/components/comment-actions";
import CommentEditor from "@/features/comment/components/comment-editor";
import CommentListItem from "@/features/comment/components/comment-list-item";
import {
  useCommentsQuery,
  useCreateCommentMutation,
} from "@/features/comment/queries/comment-query";
import { IComment } from "@/features/comment/types/comment.types.ts";
import { usePageQuery } from "@/features/page/queries/page-query.ts";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { extractPageSlugId } from "@/lib";
import { IPagination } from "@/lib/types.ts";

function CommentListWithTabs() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();
  const { data: page } = usePageQuery({ pageId: extractPageSlugId(pageSlug) });
  const {
    data: comments,
    isLoading: isCommentsLoading,
    isError,
  } = useCommentsQuery({ pageId: page?.id });
  const createCommentMutation = useCreateCommentMutation();
  const [isLoading, setIsLoading] = useState(false);
  const { data: space } = useGetSpaceBySlugQuery(page?.space?.slug);

  const canComment =
    (page?.permissions?.canEdit ?? false) ||
    space?.settings?.comments?.allowViewerComments === true;

  // Separate active and resolved comments
  const { activeComments, resolvedComments } = useMemo(() => {
    if (!comments?.items) {
      return { activeComments: [], resolvedComments: [] };
    }

    const parentComments = comments.items.filter(
      (comment: IComment) => comment.parentCommentId === null
    );

    const active = parentComments.filter(
      (comment: IComment) => !comment.resolvedAt
    );
    const resolved = parentComments.filter(
      (comment: IComment) => comment.resolvedAt
    );

    return { activeComments: active, resolvedComments: resolved };
  }, [comments]);

  const [isPageCommentLoading, setIsPageCommentLoading] = useState(false);

  const handleAddPageComment = useCallback(
    async (_commentId: string, content: string) => {
      try {
        setIsPageCommentLoading(true);
        const createdComment = await createCommentMutation.mutateAsync({
          content: JSON.stringify(content),
          pageId: page?.id,
        });

        setTimeout(() => {
          const selector = `div[data-comment-id="${createdComment.id}"]`;
          const commentElement = document.querySelector(selector);
          commentElement?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 400);
      } catch (error) {
        console.error("Failed to post comment:", error);
      } finally {
        setIsPageCommentLoading(false);
      }
    },
    [createCommentMutation, page?.id]
  );

  const handleAddReply = useCallback(
    async (commentId: string, content: string) => {
      try {
        setIsLoading(true);
        const commentData = {
          content: JSON.stringify(content),
          pageId: page?.id,
          parentCommentId: commentId,
        };

        await createCommentMutation.mutateAsync(commentData);
      } catch (error) {
        console.error("Failed to post comment:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [createCommentMutation, page?.id]
  );

  const renderComments = useCallback(
    (comment: IComment) => (
      <Paper
        data-comment-id={comment.id}
        key={comment.id}
        mb="sm"
        p="sm"
        radius="md"
        shadow="sm"
        withBorder
      >
        <div>
          <CommentListItem
            canComment={canComment}
            comment={comment}
            pageId={page?.id}
            userSpaceRole={space?.membership?.role}
          />
          <MemoizedChildComments
            canComment={canComment}
            comments={comments}
            pageId={page?.id}
            parentId={comment.id}
            userSpaceRole={space?.membership?.role}
          />
        </div>

        {!comment.resolvedAt && canComment && (
          <>
            <Divider my={4} />
            <CommentEditorWithActions
              commentId={comment.id}
              isLoading={isLoading}
              onSave={handleAddReply}
            />
          </>
        )}
      </Paper>
    ),
    [comments, handleAddReply, isLoading, space?.membership?.role, canComment]
  );

  if (isCommentsLoading) {
    return <></>;
  }

  if (isError) {
    return <div>{t("Error loading comments.")}</div>;
  }

  const totalComments = activeComments.length + resolvedComments.length;

  const pageCommentInput = canComment ? (
    <PageCommentInput
      isLoading={isPageCommentLoading}
      onSave={handleAddPageComment}
    />
  ) : null;

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Tabs
        defaultValue="open"
        style={{
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          overflow: "hidden",
        }}
        variant="default"
      >
        <Tabs.List justify="center">
          <Tabs.Tab
            leftSection={
              <Badge color="blue" size="sm" variant="light">
                {activeComments.length}
              </Badge>
            }
            value="open"
          >
            {t("Open")}
          </Tabs.Tab>
          <Tabs.Tab
            leftSection={
              <Badge color="green" size="sm" variant="light">
                {resolvedComments.length}
              </Badge>
            }
            value="resolved"
          >
            {t("Resolved")}
          </Tabs.Tab>
        </Tabs.List>

        <ScrollArea
          scrollbarSize={5}
          style={{ flex: "1 1 auto" }}
          type="scroll"
        >
          <div style={{ paddingBottom: "8px" }}>
            <Tabs.Panel pt="xs" value="open">
              {activeComments.length === 0 ? (
                <Center py="xl">
                  <Stack align="center" gap="xs">
                    <IconMessageOff
                      color="var(--mantine-color-dimmed)"
                      size={32}
                      stroke={1.5}
                    />
                    <Text c="dimmed" size="sm">
                      {t("No open comments.")}
                    </Text>
                  </Stack>
                </Center>
              ) : (
                activeComments.map(renderComments)
              )}
            </Tabs.Panel>

            <Tabs.Panel pt="xs" value="resolved">
              {resolvedComments.length === 0 ? (
                <Center py="xl">
                  <Stack align="center" gap="xs">
                    <IconMessageOff
                      color="var(--mantine-color-dimmed)"
                      size={32}
                      stroke={1.5}
                    />
                    <Text c="dimmed" size="sm">
                      {t("No resolved comments.")}
                    </Text>
                  </Stack>
                </Center>
              ) : (
                resolvedComments.map(renderComments)
              )}
            </Tabs.Panel>
          </div>
        </ScrollArea>
      </Tabs>
      {pageCommentInput}
    </div>
  );
}

interface ChildCommentsProps {
  canComment: boolean;
  comments: IPagination<IComment>;
  pageId: string;
  parentId: string;
  userSpaceRole?: string;
}
const ChildComments = ({
  comments,
  parentId,
  pageId,
  canComment,
  userSpaceRole,
}: ChildCommentsProps) => {
  const getChildComments = useCallback(
    (parentId: string) =>
      comments.items.filter(
        (comment: IComment) => comment.parentCommentId === parentId
      ),
    [comments.items]
  );

  return (
    <div>
      {getChildComments(parentId).map((childComment) => (
        <div key={childComment.id}>
          <CommentListItem
            canComment={canComment}
            comment={childComment}
            pageId={pageId}
            userSpaceRole={userSpaceRole}
          />
          <MemoizedChildComments
            canComment={canComment}
            comments={comments}
            pageId={pageId}
            parentId={childComment.id}
            userSpaceRole={userSpaceRole}
          />
        </div>
      ))}
    </div>
  );
};

const MemoizedChildComments = memo(ChildComments);

const CommentEditorWithActions = ({
  commentId,
  onSave,
  isLoading,
  placeholder,
}) => {
  const [content, setContent] = useState("");
  const { ref, focused } = useFocusWithin();
  const commentEditorRef = useRef(null);

  const handleSave = useCallback(() => {
    onSave(commentId, content);
    setContent("");
    commentEditorRef.current?.clearContent();
  }, [commentId, content, onSave]);

  return (
    <div ref={ref}>
      <CommentEditor
        editable={true}
        onSave={handleSave}
        onUpdate={setContent}
        placeholder={placeholder}
        ref={commentEditorRef}
      />
      {focused && <CommentActions isLoading={isLoading} onSave={handleSave} />}
    </div>
  );
};

const PageCommentInput = ({ onSave, isLoading }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState("");
  const { ref, focused } = useFocusWithin();
  const commentEditorRef = useRef(null);
  const [currentUser] = useAtom(currentUserAtom);

  const handleSave = useCallback(() => {
    onSave(null, content);
    setContent("");
    commentEditorRef.current?.clearContent();
  }, [content, onSave]);

  return (
    <div
      ref={ref}
      style={{
        borderTop: "1px solid var(--mantine-color-default-border)",
        flex: "0 0 auto",
        paddingBottom: 25,
        paddingTop: "var(--mantine-spacing-sm)",
        position: "relative",
      }}
    >
      <Group align="flex-start" gap="xs" wrap="nowrap">
        <CustomAvatar
          avatarUrl={currentUser?.user?.avatarUrl}
          name={currentUser?.user?.name}
          size="sm"
          style={{ flexShrink: 0, marginTop: 10 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <CommentEditor
            editable={true}
            onSave={handleSave}
            onUpdate={setContent}
            placeholder={t("Add a comment...")}
            ref={commentEditorRef}
            surface="muted"
          />
        </div>
      </Group>
      {focused && (
        <ActionIcon
          aria-label={t("Send comment")}
          loading={isLoading}
          onClick={handleSave}
          onMouseDown={(e) => e.preventDefault()}
          radius="xl"
          size="sm"
          style={{ bottom: 30, position: "absolute", right: 8 }}
          variant="filled"
        >
          <IconArrowUp size={16} />
        </ActionIcon>
      )}
    </div>
  );
};

export default CommentListWithTabs;
