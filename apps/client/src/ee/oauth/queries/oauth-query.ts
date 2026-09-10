import { notifications } from "@mantine/notifications";
import {
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  getOAuthGrants,
  revokeOAuthGrant,
} from "@/ee/oauth/services/oauth-service";
import { IOAuthGrant } from "@/ee/oauth/types/oauth.types";

export function useOAuthGrantsQuery(): UseQueryResult<IOAuthGrant[], Error> {
  return useQuery({
    gcTime: 0,
    queryFn: () => getOAuthGrants(),
    queryKey: ["oauth-grants"],
    staleTime: 0,
  });
}

export function useRevokeOAuthGrantMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (grantId) => revokeOAuthGrant(grantId),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Something went wrong. Please try again."),
      });
    },
    onSuccess: () => {
      notifications.show({ message: t("Access revoked") });
      queryClient.invalidateQueries({
        predicate: (item) =>
          ["oauth-grants"].includes(item.queryKey[0] as string),
      });
    },
  });
}
