import { notifications } from "@mantine/notifications";
import {
  keepPreviousData,
  UseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  addPagePermission,
  getPagePermissions,
  getPageRestrictionInfo,
  removePagePermission,
  restrictPage,
  unrestrictPage,
  updatePagePermissionRole,
} from "@/ee/page-permission/services/page-permission-service";
import {
  IAddPagePermission,
  IPageRestrictionInfo,
  IRemovePagePermission,
  IUpdatePagePermissionRole,
} from "@/ee/page-permission/types/page-permission.types";
import { IPage } from "@/features/page/types/page.types";

export function usePageRestrictionInfoQuery(
  pageId: string | undefined
): UseQueryResult<IPageRestrictionInfo, Error> {
  return useQuery({
    enabled: !!pageId,
    queryFn: () => getPageRestrictionInfo(pageId),
    queryKey: ["page-restriction-info", pageId],
  });
}

export function usePagePermissionsQuery(pageId: string) {
  return useInfiniteQuery({
    enabled: !!pageId,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    //gcTime: 5000,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) => getPagePermissions(pageId, pageParam),
    queryKey: ["page-permissions", pageId],
  });
}

function updatePageRestrictionCache(
  queryClient: ReturnType<typeof useQueryClient>,
  pageId: string,
  hasRestriction: boolean
) {
  queryClient.setQueriesData<IPage>({ queryKey: ["pages"] }, (old) => {
    if (old?.id === pageId) {
      return {
        ...old,
        permissions: { ...old.permissions, hasRestriction },
      };
    }
    return old;
  });
  queryClient.invalidateQueries({
    queryKey: ["page-restriction-info", pageId],
  });
  queryClient.removeQueries({
    queryKey: ["page-permissions", pageId],
  });
}

export function useRestrictPageMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (pageId) => restrictPage(pageId),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to restrict page"),
      });
    },
    onSuccess: (_, pageId) => {
      updatePageRestrictionCache(queryClient, pageId, true);
    },
  });
}

export function useUnrestrictPageMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (pageId) => unrestrictPage(pageId),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to remove page restriction"),
      });
    },
    onSuccess: (_, pageId) => {
      updatePageRestrictionCache(queryClient, pageId, false);
    },
  });
}

export function useAddPagePermissionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IAddPagePermission>({
    mutationFn: (data) => addPagePermission(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to add permission"),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["page-permissions", variables.pageId],
      });
    },
  });
}

export function useRemovePagePermissionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IRemovePagePermission>({
    mutationFn: (data) => removePagePermission(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to remove permission"),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["page-permissions", variables.pageId],
      });
    },
  });
}

export function useUpdatePagePermissionRoleMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IUpdatePagePermissionRole>({
    mutationFn: (data) => updatePagePermissionRole(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to update permission"),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.refetchQueries({
        queryKey: ["page-permissions", variables.pageId],
      });
    },
  });
}
