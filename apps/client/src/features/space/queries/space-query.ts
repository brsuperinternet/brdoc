import { notifications } from "@mantine/notifications";
import {
  keepPreviousData,
  UseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { validate as isValidUuid } from "uuid";
import { getRecentChanges } from "@/features/page/services/page-service.ts";
import {
  addSpaceMember,
  changeMemberRole,
  createSpace,
  deleteSpace,
  getSpaceById,
  getSpaceMembers,
  getSpaces,
  removeSpaceMember,
  updateSpace,
} from "@/features/space/services/space-service.ts";
import {
  IAddSpaceMember,
  IChangeSpaceMemberRole,
  IRemoveSpaceMember,
  ISpace,
} from "@/features/space/types/space.types";
import { IPagination, QueryParams } from "@/lib/types.ts";
import { queryClient } from "@/main.tsx";

export function useGetSpacesQuery(
  params?: QueryParams
): UseQueryResult<IPagination<ISpace>, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getSpaces(params),
    queryKey: ["spaces", params],
    refetchOnMount: true,
  });
}

export function useSpaceQuery(spaceId: string): UseQueryResult<ISpace, Error> {
  const query = useQuery({
    enabled: !!spaceId,
    queryFn: () => getSpaceById(spaceId),
    queryKey: ["space", spaceId],
  });
  useEffect(() => {
    if (query.data) {
      if (isValidUuid(spaceId)) {
        queryClient.setQueryData(["space", query.data.slug], query.data);
      } else {
        queryClient.setQueryData(["space", query.data.id], query.data);
      }
    }
  }, [query.data]);

  return query;
}

export const prefetchSpace = (spaceSlug: string, spaceId?: string) => {
  queryClient.prefetchQuery({
    queryFn: () => getSpaceById(spaceSlug),
    queryKey: ["space", spaceSlug],
  });

  if (spaceId) {
    // this endpoint only accepts uuid for now
    queryClient.prefetchInfiniteQuery({
      initialPageParam: undefined,
      queryFn: () => getRecentChanges({ spaceId }),
      queryKey: ["recent-changes", spaceId],
    });
  }
};

export function useCreateSpaceMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<ISpace, Error, Partial<ISpace>>({
    mutationFn: (data) => createSpace(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["spaces"],
      });
      notifications.show({ message: t("Space created successfully") });
    },
  });
}

export function useGetSpaceBySlugQuery(
  spaceId: string
): UseQueryResult<ISpace, Error> {
  return useQuery({
    enabled: !!spaceId,
    queryFn: () => getSpaceById(spaceId),
    queryKey: ["space", spaceId],
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSpaceMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<ISpace, Error, Partial<ISpace>>({
    mutationFn: (data) => updateSpace(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Space updated successfully") });

      const space = queryClient.getQueryData([
        "space",
        variables.spaceId,
      ]) as ISpace;
      if (space) {
        const updatedSpace = { ...space, ...data };
        queryClient.setQueryData(["space", variables.spaceId], updatedSpace);
        queryClient.setQueryData(["space", data.slug], updatedSpace);
      }

      queryClient.invalidateQueries({
        queryKey: ["spaces"],
      });
    },
  });
}

export function useDeleteSpaceMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: Partial<ISpace>) => deleteSpace(data.id),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Space deleted successfully") });

      if (variables.slug) {
        queryClient.removeQueries({
          exact: true,
          queryKey: ["space", variables.slug],
        });
      }

      // Remove space-specific queries
      if (variables.id) {
        queryClient.removeQueries({
          exact: true,
          queryKey: ["space", variables.id],
        });

        // Invalidate recent changes
        queryClient.invalidateQueries({
          queryKey: ["recent-changes"],
        });

        queryClient.invalidateQueries({
          queryKey: ["recent-changes", variables.id],
        });
      }

      // Update spaces list cache
      /* const spaces = queryClient.getQueryData(["spaces"]) as any;
      if (spaces) {
        spaces.items = spaces.items?.filter(
          (space: ISpace) => space.id !== variables.id,
        );
        queryClient.setQueryData(["spaces"], spaces);
      }*/

      // Invalidate all spaces queries to refresh lists
      queryClient.invalidateQueries({
        predicate: (item) => ["spaces"].includes(item.queryKey[0] as string),
      });
    },
  });
}

export function useSpaceMembersInfiniteQuery(spaceId: string, query?: string) {
  return useInfiniteQuery({
    enabled: !!spaceId,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      getSpaceMembers(spaceId, { cursor: pageParam, limit: 50, query }),
    queryKey: ["spaceMembers", spaceId, query],
  });
}

export function useAddSpaceMemberMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IAddSpaceMember>({
    mutationFn: (data) => addSpaceMember(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Members added successfully") });
      queryClient.invalidateQueries({
        queryKey: ["spaceMembers", variables.spaceId],
      });
    },
  });
}

export function useRemoveSpaceMemberMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IRemoveSpaceMember>({
    mutationFn: (data) => removeSpaceMember(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Member removed successfully") });
      queryClient.invalidateQueries({
        queryKey: ["spaceMembers", variables.spaceId],
      });
    },
  });
}

export function useChangeSpaceMemberRoleMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IChangeSpaceMemberRole>({
    mutationFn: (data) => changeMemberRole(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Member role updated successfully") });
      // due to pagination levels, change in cache instead
      queryClient.refetchQueries({
        queryKey: ["spaceMembers", variables.spaceId],
      });
    },
  });
}
