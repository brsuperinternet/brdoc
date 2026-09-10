import { notifications } from "@mantine/notifications";
import {
  keepPreviousData,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  createShare,
  deleteShare,
  getSharedPageTree,
  getShareForPage,
  getShareInfo,
  getSharePageInfo,
  getShares,
  updateShare,
} from "@/features/share/services/share-service.ts";
import {
  ICreateShare,
  IShare,
  ISharedItem,
  ISharedPage,
  ISharedPageTree,
  IShareForPage,
  IShareInfoInput,
  IUpdateShare,
} from "@/features/share/types/share.types.ts";
import { IPagination, QueryParams } from "@/lib/types.ts";

export function useGetSharesQuery(
  params?: QueryParams
): UseQueryResult<IPagination<ISharedItem>, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getShares(params),
    queryKey: ["share-list", params],
  });
}

export function useGetShareByIdQuery(
  shareId: string
): UseQueryResult<IShare, Error> {
  const query = useQuery({
    enabled: !!shareId,
    queryFn: () => getShareInfo(shareId),
    queryKey: ["share-by-id", shareId],
  });

  return query;
}

export function useSharePageQuery(
  shareInput: Partial<IShareInfoInput>
): UseQueryResult<ISharedPage, Error> {
  const query = useQuery({
    enabled: !!shareInput.pageId,
    queryFn: () => getSharePageInfo(shareInput),
    queryKey: ["shares", shareInput],
  });

  return query;
}

export function useShareForPageQuery(
  pageId: string
): UseQueryResult<IShareForPage, Error> {
  const query = useQuery({
    enabled: !!pageId,
    queryFn: () => getShareForPage(pageId),
    queryKey: ["share-for-page", pageId],
    retry: false,
    staleTime: 60 * 1000,
  });

  return query;
}

export function useCreateShareMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation<any, Error, ICreateShare>({
    mutationFn: (data) => createShare(data),
    onError: (error) => {
      notifications.show({
        color: "red",
        message:
          error?.["response"]?.data?.message || t("Failed to share page"),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (item) =>
          ["share-for-page", "share-list"].includes(item.queryKey[0] as string),
      });
    },
  });
}

export function useUpdateShareMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation<any, Error, IUpdateShare>({
    mutationFn: (data) => updateShare(data),
    onError: (error, params) => {
      if (error?.["status"] === 404) {
        queryClient.removeQueries({
          predicate: (item) =>
            ["share-for-page"].includes(item.queryKey[0] as string),
        });

        notifications.show({
          color: "red",
          message: t("Share not found"),
        });
        return;
      }

      notifications.show({
        color: "red",
        message: error?.["response"]?.data?.message || "Share not found",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (item) =>
          ["share-for-page", "share-list"].includes(item.queryKey[0] as string),
      });
    },
  });
}

export function useDeleteShareMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shareId: string) => deleteShare(shareId),
    onError: (error) => {
      if (error?.["status"] === 404) {
        queryClient.removeQueries({
          predicate: (item) =>
            ["share-for-page"].includes(item.queryKey[0] as string),
        });
      }

      notifications.show({
        color: "red",
        message: error?.["response"]?.data?.message || "Failed to delete share",
      });
    },
    onSuccess: (data) => {
      queryClient.removeQueries({
        predicate: (item) =>
          ["share-for-page"].includes(item.queryKey[0] as string),
      });

      queryClient.invalidateQueries({
        predicate: (item) =>
          ["share-list"].includes(item.queryKey[0] as string),
      });

      notifications.show({ message: t("Share deleted successfully") });
    },
  });
}

export function useGetSharedPageTreeQuery(
  shareId: string
): UseQueryResult<ISharedPageTree, Error> {
  return useQuery({
    enabled: !!shareId,
    placeholderData: keepPreviousData,
    queryFn: () => getSharedPageTree(shareId),
    queryKey: ["shared-page-tree", shareId],
    staleTime: 60 * 60 * 1000,
  });
}
