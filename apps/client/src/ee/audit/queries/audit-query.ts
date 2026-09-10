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
  getAuditLogs,
  getAuditRetention,
  updateAuditRetention,
} from "@/ee/audit/services/audit-service";
import { IAuditLog, IAuditLogParams } from "@/ee/audit/types/audit.types";
import { IPagination } from "@/lib/types";

export function useAuditLogsQuery(
  params?: IAuditLogParams
): UseQueryResult<IPagination<IAuditLog>, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getAuditLogs(params),
    queryKey: ["audit-logs", params],
  });
}

export function useAuditRetentionQuery() {
  return useQuery({
    queryFn: () => getAuditRetention(),
    queryKey: ["audit-retention"],
  });
}

export function useUpdateAuditRetentionMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: { auditRetentionDays: number }) =>
      updateAuditRetention(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      notifications.show({ message: t("Audit retention updated") });
      queryClient.invalidateQueries({ queryKey: ["audit-retention"] });
    },
  });
}
