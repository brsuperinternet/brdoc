import { notifications } from "@mantine/notifications";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  createComment,
  deleteComment,
  getPageComments,
  updateComment,
} from "@/features/comment/services/comment-service";
import {
  IComment,
  ICommentParams,
} from "@/features/comment/types/comment.types";
import { IPagination } from "@/lib/types.ts";

export const RQ_KEY = (pageId: string) => ["comments", pageId];

export function useCommentsQuery(params: ICommentParams) {
  const query = useInfiniteQuery({
    enabled: !!params.pageId,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getPageComments({ cursor: pageParam, limit: 100, pageId: params.pageId }),
    queryKey: RQ_KEY(params.pageId),
  });

  useEffect(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  const data = useMemo<IPagination<IComment> | undefined>(() => {
    if (!query.data) {
      return;
    }
    return {
      items: query.data.pages.flatMap((p) => p.items),
      meta: query.data.pages[query.data.pages.length - 1].meta,
    };
  }, [query.data]);

  return {
    data,
    isError: query.isError,
    isLoading: query.isLoading || query.hasNextPage,
  };
}

export function useCreateCommentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<IComment, Error, Partial<IComment>>({
    mutationFn: (data) => createComment(data),
    onError: () => {
      notifications.show({
        color: "red",
        message: t("Error creating comment"),
      });
    },
    onSuccess: (newComment) => {
      const cache = queryClient.getQueryData(RQ_KEY(newComment.pageId)) as
        | InfiniteData<IPagination<IComment>>
        | undefined;

      if (cache && cache.pages.length > 0) {
        const alreadyExists = cache.pages.some((page) =>
          page.items.some((c) => c.id === newComment.id)
        );
        if (alreadyExists) {
          return;
        }

        const lastIdx = cache.pages.length - 1;
        queryClient.setQueryData(RQ_KEY(newComment.pageId), {
          ...cache,
          pages: cache.pages.map((page, i) =>
            i === lastIdx
              ? { ...page, items: [...page.items, newComment] }
              : page
          ),
        });
      }

      notifications.show({ message: t("Comment created successfully") });
    },
  });
}

export function useUpdateCommentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<IComment, Error, Partial<IComment>>({
    mutationFn: (data) => updateComment(data),
    onError: () => {
      notifications.show({
        color: "red",
        message: t("Failed to update comment"),
      });
    },
    onSuccess: (updatedComment) => {
      const cache = queryClient.getQueryData(RQ_KEY(updatedComment.pageId)) as
        | InfiniteData<IPagination<IComment>>
        | undefined;

      if (cache) {
        queryClient.setQueryData(RQ_KEY(updatedComment.pageId), {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            items: page.items.map((comment) =>
              comment.id === updatedComment.id ? updatedComment : comment
            ),
          })),
        });
      }

      notifications.show({ message: t("Comment updated successfully") });
    },
  });
}

export function useDeleteCommentMutation(pageId?: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onError: () => {
      notifications.show({
        color: "red",
        message: t("Failed to delete comment"),
      });
    },
    onSuccess: (_data, commentId) => {
      const cache = queryClient.getQueryData(RQ_KEY(pageId)) as
        | InfiniteData<IPagination<IComment>>
        | undefined;

      if (cache) {
        queryClient.setQueryData(RQ_KEY(pageId), {
          ...cache,
          pages: cache.pages.map((page) => ({
            ...page,
            items: page.items.filter((comment) => comment.id !== commentId),
          })),
        });
      }

      notifications.show({ message: t("Comment deleted successfully") });
    },
  });
}

// EE: useResolveCommentMutation has been moved to @/ee/comment/queries/comment-query
