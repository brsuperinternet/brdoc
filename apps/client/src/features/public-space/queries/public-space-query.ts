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
  getPublicSpaceDirectory,
  getPublicSpaceForSpace,
  getPublicSpacePage,
  getPublicSpaceTree,
  getPublishedSpaces,
  publishSpace,
} from "@/features/public-space/services/public-space-service.ts";
import {
  IPublicSpace,
  IPublicSpaceDirectory,
  IPublicSpacePage,
  IPublicSpaceTree,
  IPublishedSpaceItem,
  IPublishSpace,
} from "@/features/public-space/types/public-space.types.ts";
import { IPagination, QueryParams } from "@/lib/types.ts";

export function usePublicSpaceTreeQuery(
  spaceSlug: string
): UseQueryResult<IPublicSpaceTree, Error> {
  return useQuery({
    enabled: !!spaceSlug,
    placeholderData: keepPreviousData,
    queryFn: () => getPublicSpaceTree(spaceSlug),
    queryKey: ["public-space-tree", spaceSlug],
    staleTime: 60 * 60 * 1000,
  });
}

export function usePublicSpacePageQuery(params: {
  spaceSlug: string;
  pageSlugId?: string;
  contentless?: boolean;
}): UseQueryResult<IPublicSpacePage, Error> {
  return useQuery({
    enabled: !!params.spaceSlug,
    queryFn: () => getPublicSpacePage(params),
    queryKey: ["public-space-page", params],
  });
}

export function usePublicSpaceDirectoryQuery(): UseQueryResult<
  IPublicSpaceDirectory,
  Error
> {
  return useQuery({
    queryFn: () => getPublicSpaceDirectory(),
    queryKey: ["public-space-directory"],
  });
}

export function usePublicSpaceForSpaceQuery(
  spaceId: string
): UseQueryResult<IPublicSpace | null, Error> {
  return useQuery({
    enabled: !!spaceId,
    queryFn: () => getPublicSpaceForSpace(spaceId),
    queryKey: ["public-space-for-space", spaceId],
    retry: false,
    staleTime: 60 * 1000,
  });
}

export function usePublishedSpacesQuery(
  params?: QueryParams
): UseQueryResult<IPagination<IPublishedSpaceItem>, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getPublishedSpaces(params),
    queryKey: ["published-spaces", params],
  });
}

export function usePublishSpaceMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation<IPublicSpace, Error, IPublishSpace>({
    mutationFn: (data) => publishSpace(data),
    onError: (error) => {
      notifications.show({
        color: "red",
        message:
          error?.["response"]?.data?.message || t("Failed to update space"),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (item) =>
          [
            "public-space-for-space",
            "published-spaces",
            "space",
            "spaces",
          ].includes(item.queryKey[0] as string),
      });
    },
  });
}
