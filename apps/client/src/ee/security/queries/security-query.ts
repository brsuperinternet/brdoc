import { notifications } from "@mantine/notifications";
import {
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSsoProvider,
  deleteSsoProvider,
  getSsoProviderById,
  getSsoProviders,
  updateSsoProvider,
} from "@/ee/security/services/security-service.ts";
import { IAuthProvider } from "@/ee/security/types/security.types.ts";
import { IPagination } from "@/lib/types.ts";

export function useGetSsoProviders(): UseQueryResult<
  IPagination<IAuthProvider>,
  Error
> {
  return useQuery({
    queryFn: () => getSsoProviders(),
    queryKey: ["sso-providers"],
    staleTime: 5 * 60 * 1000,
  });
}

export function useSsoProvider(
  providerId: string
): UseQueryResult<IAuthProvider, Error> {
  return useQuery({
    enabled: !!providerId,
    queryFn: () => getSsoProviderById({ providerId }),
    queryKey: ["sso-provider", providerId],
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateSsoProviderMutation() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, Partial<IAuthProvider>>({
    mutationFn: (data: Partial<IAuthProvider>) => createSsoProvider(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sso-providers"],
      });
    },
  });
}

export function useUpdateSsoProviderMutation() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, Partial<IAuthProvider>>({
    mutationFn: (data: Partial<IAuthProvider>) => updateSsoProvider(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: "Updated successfully" });
      queryClient.invalidateQueries({
        queryKey: ["sso-providers"],
      });
    },
  });
}

export function useDeleteSsoProviderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => deleteSsoProvider({ providerId }),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: "Deleted successfully" });

      queryClient.invalidateQueries({
        queryKey: ["sso-providers"],
      });
    },
  });
}
