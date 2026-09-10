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
  createScimToken,
  getScimTokens,
  revokeScimToken,
  updateScimToken,
} from "@/ee/scim/services/scim-token-service";
import {
  ICreateScimTokenRequest,
  IRevokeScimTokenRequest,
  IScimToken,
  IUpdateScimTokenRequest,
} from "@/ee/scim/types/scim-token.types";
import { IPagination, QueryParams } from "@/lib/types.ts";

export function useGetScimTokensQuery(
  params?: QueryParams
): UseQueryResult<IPagination<IScimToken>, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getScimTokens(params),
    queryKey: ["scim-token-list", params],
  });
}

export function useCreateScimTokenMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<IScimToken, Error, ICreateScimTokenRequest>({
    mutationFn: (data) => createScimToken(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      notifications.show({
        message: t("{{credential}} created successfully", {
          credential: t("SCIM token"),
        }),
      });
      queryClient.invalidateQueries({
        predicate: (item) =>
          ["scim-token-list"].includes(item.queryKey[0] as string),
      });
    },
  });
}

export function useUpdateScimTokenMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IUpdateScimTokenRequest>({
    mutationFn: (data) => updateScimToken(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      notifications.show({ message: t("Updated successfully") });
      queryClient.invalidateQueries({
        predicate: (item) =>
          ["scim-token-list"].includes(item.queryKey[0] as string),
      });
    },
  });
}

export function useRevokeScimTokenMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IRevokeScimTokenRequest>({
    mutationFn: (data) => revokeScimToken(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      notifications.show({ message: t("Revoked successfully") });
      queryClient.invalidateQueries({
        predicate: (item) =>
          ["scim-token-list"].includes(item.queryKey[0] as string),
      });
    },
  });
}
