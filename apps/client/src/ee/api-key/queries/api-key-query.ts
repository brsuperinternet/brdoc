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
  createApiKey,
  getApiKeys,
  IApiKey,
  ICreateApiKeyRequest,
  IUpdateApiKeyRequest,
  revokeApiKey,
  updateApiKey,
} from "@/ee/api-key";
import { IPagination, QueryParams } from "@/lib/types.ts";

export function useGetApiKeysQuery(
  params?: QueryParams
): UseQueryResult<IPagination<IApiKey>, Error> {
  return useQuery({
    gcTime: 0,
    placeholderData: keepPreviousData,
    queryFn: () => getApiKeys(params),
    queryKey: ["api-key-list", params],
    staleTime: 0,
  });
}

export function useRevokeApiKeyMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    void,
    Error,
    {
      apiKeyId: string;
    }
  >({
    mutationFn: (data) => revokeApiKey(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Revoked successfully") });
      queryClient.invalidateQueries({
        predicate: (item) =>
          ["api-key-list"].includes(item.queryKey[0] as string),
      });
    },
  });
}

export function useCreateApiKeyMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<IApiKey, Error, ICreateApiKeyRequest>({
    mutationFn: (data) => createApiKey(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      notifications.show({
        message: t("{{credential}} created successfully", {
          credential: t("API key"),
        }),
      });
      queryClient.invalidateQueries({
        predicate: (item) =>
          ["api-key-list"].includes(item.queryKey[0] as string),
      });
    },
  });
}

export function useUpdateApiKeyMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<IApiKey, Error, IUpdateApiKeyRequest>({
    mutationFn: (data) => updateApiKey(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: (data, variables) => {
      notifications.show({ message: t("Updated successfully") });
      queryClient.invalidateQueries({
        predicate: (item) =>
          ["api-key-list"].includes(item.queryKey[0] as string),
      });
    },
  });
}
