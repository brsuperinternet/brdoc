import { notifications } from "@mantine/notifications";
import {
  keepPreviousData,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroupById,
  getGroupMembers,
  getGroups,
  removeGroupMember,
  updateGroup,
} from "@/features/group/services/group-service";
import { IGroup } from "@/features/group/types/group.types";
import { IUser } from "@/features/user/types/user.types.ts";
import { IPagination, QueryParams } from "@/lib/types.ts";
import { queryClient } from "@/main.tsx";

export function useGetGroupsQuery(
  params?: QueryParams
): UseQueryResult<IPagination<IGroup>, Error> {
  const query = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getGroups(params),
    queryKey: ["groups", params],
  });

  useEffect(() => {
    if (query.data && query.data.items?.length > 0) {
      query.data.items.forEach((group: IGroup) => {
        queryClient.setQueryData(["group", group.id], group);
      });
    }
  }, [query.data]);

  return query;
}

export function useGroupQuery(groupId: string): UseQueryResult<IGroup, Error> {
  return useQuery({
    enabled: !!groupId,
    queryFn: () => getGroupById(groupId),
    queryKey: ["group", groupId],
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation<IGroup, Error, Partial<IGroup>>({
    mutationFn: (data) => createGroup(data),
    onError: () => {
      notifications.show({ color: "red", message: "Failed to create group" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["groups"],
      });

      notifications.show({ message: "Group created successfully" });
    },
  });
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<IGroup, Error, Partial<IGroup>>({
    mutationFn: (data) => updateGroup(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Group updated successfully") });
      queryClient.invalidateQueries({
        queryKey: ["group", variables.groupId],
      });
    },
  });
}

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (groupId: string) => deleteGroup({ groupId }),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Group deleted successfully") });
      queryClient.refetchQueries({ queryKey: ["groups"] });
    },
  });
}

export function useGroupMembersQuery(
  groupId: string,
  params?: QueryParams
): UseQueryResult<IPagination<IUser>, Error> {
  return useQuery({
    enabled: !!groupId,
    placeholderData: keepPreviousData,
    queryFn: () => getGroupMembers(groupId, params),
    queryKey: ["groupMembers", groupId, params],
  });
}

export function useAddGroupMemberMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, { groupId: string; userIds: string[] }>({
    mutationFn: (data) => addGroupMember(data),
    onError: () => {
      notifications.show({
        color: "red",
        message: "Failed to add group members",
      });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Added successfully") });
      queryClient.invalidateQueries({
        queryKey: ["groupMembers", variables.groupId],
      });
    },
  });
}

export function useRemoveGroupMemberMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    void,
    Error,
    {
      groupId: string;
      userId: string;
    }
  >({
    mutationFn: (data) => removeGroupMember(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Removed successfully") });
      queryClient.invalidateQueries({
        queryKey: ["groupMembers", variables.groupId],
      });
    },
  });
}
