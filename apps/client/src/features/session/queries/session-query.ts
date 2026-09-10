import { notifications } from "@mantine/notifications";
import {
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  getSessions,
  revokeAllSessions,
  revokeSession,
} from "@/features/session/services/session-service";
import { ISession } from "@/features/session/types/session.types";

export function useGetSessionsQuery(): UseQueryResult<ISession[], Error> {
  return useQuery({
    queryFn: () => getSessions(),
    queryKey: ["session-list"],
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, { sessionId: string }>({
    mutationFn: (data) => revokeSession(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      notifications.show({ message: t("Session revoked") });
      queryClient.invalidateQueries({ queryKey: ["session-list"] });
    },
  });
}

export function useRevokeAllSessionsMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, void>({
    mutationFn: () => revokeAllSessions(),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      notifications.show({ message: t("All other sessions revoked") });
      queryClient.invalidateQueries({ queryKey: ["session-list"] });
    },
  });
}
