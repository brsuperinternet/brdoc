import { notifications } from "@mantine/notifications";
import {
  keepPreviousData,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { IUser } from "@/features/user/types/user.types.ts";
import {
  activateWorkspaceMember,
  changeMemberRole,
  createInvitation,
  deactivateWorkspaceMember,
  deleteWorkspaceMember,
  getAppVersion,
  getInvitationById,
  getPendingInvitations,
  getWorkspace,
  getWorkspaceMembers,
  getWorkspacePublicData,
  resendInvitation,
  revokeInvitation,
} from "@/features/workspace/services/workspace-service";
import {
  ICreateInvite,
  IInvitation,
  IPublicWorkspace,
  IVersion,
  IWorkspace,
} from "@/features/workspace/types/workspace.types.ts";
import { IPagination, QueryParams } from "@/lib/types.ts";

export function useWorkspaceQuery(): UseQueryResult<IWorkspace, Error> {
  return useQuery({
    queryFn: () => getWorkspace(),
    queryKey: ["workspace"],
  });
}

export function useWorkspacePublicDataQuery(): UseQueryResult<
  IPublicWorkspace,
  Error
> {
  return useQuery({
    queryFn: () => getWorkspacePublicData(),
    queryKey: ["workspace-public"],
  });
}

export function useWorkspaceMembersQuery(
  params?: QueryParams
): UseQueryResult<IPagination<IUser>, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getWorkspaceMembers(params),
    queryKey: ["workspaceMembers", params],
  });
}

export function useDeleteWorkspaceMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      userId: string;
    }
  >({
    mutationFn: (data) => deleteWorkspaceMember(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: "Member deleted successfully" });
      queryClient.invalidateQueries({
        queryKey: ["workspaceMembers"],
      });
    },
  });
}

export function useDeactivateWorkspaceMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      userId: string;
    }
  >({
    mutationFn: (data) => deactivateWorkspaceMember(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspaceMembers"],
      });
    },
  });
}

export function useActivateWorkspaceMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      userId: string;
    }
  >({
    mutationFn: (data) => activateWorkspaceMember(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspaceMembers"],
      });
    },
  });
}

export function useChangeMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, any>({
    mutationFn: (data) => changeMemberRole(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: "Member role updated successfully" });
      queryClient.refetchQueries({
        queryKey: ["workspaceMembers"],
      });
    },
  });
}

export function useWorkspaceInvitationsQuery(
  params?: QueryParams
): UseQueryResult<IPagination<IInvitation>, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getPendingInvitations(params),
    queryKey: ["invitations", params],
  });
}

export function useCreateInvitationMutation() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation<void, Error, ICreateInvite>({
    mutationFn: (data) => createInvitation(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Invitation sent") });
      queryClient.refetchQueries({
        queryKey: ["invitations"],
      });
    },
  });
}

export function useResendInvitationMutation() {
  return useMutation<
    void,
    Error,
    {
      invitationId: string;
    }
  >({
    mutationFn: (data) => resendInvitation(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: "Invitation resent" });
    },
  });
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      invitationId: string;
    }
  >({
    mutationFn: (data) => revokeInvitation(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: "Invitation revoked" });
      queryClient.invalidateQueries({
        queryKey: ["invitations"],
      });
    },
  });
}

export function useGetInvitationQuery(
  invitationId: string
): UseQueryResult<IInvitation, Error> {
  return useQuery({
    enabled: !!invitationId,
    queryFn: () => getInvitationById({ invitationId }),
    queryKey: ["invitations", invitationId],
  });
}

export function useAppVersion(
  isEnabled: boolean
): UseQueryResult<IVersion, Error> {
  return useQuery({
    enabled: isEnabled,
    queryFn: () => getAppVersion(),
    queryKey: ["version"],
    refetchOnMount: true,
    staleTime: 60 * 60 * 1000, // 1 hr
  });
}
