import { notifications } from "@mantine/notifications";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { RQ_KEY } from "@/features/comment/queries/comment-query";
import { resolveComment } from "@/features/comment/services/comment-service";
import {
  IComment,
  IResolveComment,
} from "@/features/comment/types/comment.types";
import { IPagination } from "@/lib/types.ts";

function updateCommentInCache(
  cache: InfiniteData<IPagination<IComment>>,
  commentId: string,
  updater: (comment: IComment) => IComment
): InfiniteData<IPagination<IComment>> {
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      items: page.items.map((comment) =>
        comment.id === commentId ? updater(comment) : comment
      ),
    })),
  };
}

export function useResolveCommentMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: IResolveComment) => resolveComment(data),
    onError: (_err, variables, context) => {
      if (context?.previousCache) {
        queryClient.setQueryData(
          RQ_KEY(variables.pageId),
          context.previousCache
        );
      }
      notifications.show({
        color: "red",
        message: t("Failed to resolve comment"),
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: RQ_KEY(variables.pageId) });
      const previousCache = queryClient.getQueryData(RQ_KEY(variables.pageId));

      const cache = previousCache as
        | InfiniteData<IPagination<IComment>>
        | undefined;
      if (cache) {
        queryClient.setQueryData(
          RQ_KEY(variables.pageId),
          updateCommentInCache(cache, variables.commentId, (comment) => ({
            ...comment,
            resolvedAt: variables.resolved ? new Date() : null,
            resolvedBy: variables.resolved
              ? ({
                  avatarUrl: null,
                  id: "optimistic",
                  name: "",
                } as IComment["resolvedBy"])
              : null,
            resolvedById: variables.resolved ? "optimistic" : null,
          }))
        );
      }

      return { previousCache };
    },
    onSuccess: (data: IComment, variables) => {
      const cache = queryClient.getQueryData(RQ_KEY(data.pageId)) as
        | InfiniteData<IPagination<IComment>>
        | undefined;

      if (cache) {
        queryClient.setQueryData(
          RQ_KEY(data.pageId),
          updateCommentInCache(cache, variables.commentId, (comment) => ({
            ...comment,
            resolvedAt: data.resolvedAt,
            resolvedBy: data.resolvedBy,
            resolvedById: data.resolvedById,
          }))
        );
      }

      notifications.show({
        message: variables.resolved
          ? t("Comment resolved successfully")
          : t("Comment re-opened successfully"),
      });
    },
  });
}
