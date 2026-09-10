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
  getVerificationInfo,
  getVerificationList,
  markObsolete,
  rejectApproval,
  removeVerification,
  setupVerification,
  submitForApproval,
  updateVerification,
  verifyPage,
} from "@/ee/page-verification/services/page-verification-service";
import {
  IPageVerificationInfo,
  ISetupVerification,
  IUpdateVerification,
  IVerificationListItem,
  IVerificationListParams,
} from "@/ee/page-verification/types/page-verification.types";
import { IPagination } from "@/lib/types";

export function usePageVerificationInfoQuery(
  pageId: string | undefined
): UseQueryResult<IPageVerificationInfo, Error> {
  return useQuery({
    enabled: !!pageId,
    queryFn: () => getVerificationInfo(pageId!),
    queryKey: ["page-verification-info", pageId],
  });
}

export function useSetupVerificationMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, ISetupVerification>({
    mutationFn: (data) => setupVerification(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to enable verification"),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["page-verification-info", variables.pageId],
      });
      notifications.show({ message: t("Verification enabled") });
    },
  });
}

export function useUpdateVerificationMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IUpdateVerification>({
    mutationFn: (data) => updateVerification(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to update verification"),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["page-verification-info", variables.pageId],
      });
      notifications.show({ message: t("Verification updated") });
    },
  });
}

export function useRemoveVerificationMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (pageId) => removeVerification(pageId),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to remove verification"),
      });
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({
        queryKey: ["page-verification-info", pageId],
      });
      notifications.show({ message: t("Verification removed") });
    },
  });
}

export function useVerifyPageMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (pageId) => verifyPage(pageId),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to verify page"),
      });
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({
        queryKey: ["page-verification-info", pageId],
      });
      notifications.show({ message: t("Page verified") });
    },
  });
}

export function useSubmitForApprovalMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (pageId) => submitForApproval(pageId),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to submit for approval"),
      });
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({
        queryKey: ["page-verification-info", pageId],
      });
      notifications.show({ message: t("Submitted for approval") });
    },
  });
}

export function useRejectApprovalMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, { pageId: string; comment?: string }>({
    mutationFn: (data) => rejectApproval(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to reject approval"),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["page-verification-info", variables.pageId],
      });
      notifications.show({ message: t("Approval rejected") });
    },
  });
}

export function useMarkObsoleteMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (pageId) => markObsolete(pageId),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to mark as obsolete"),
      });
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({
        queryKey: ["page-verification-info", pageId],
      });
      notifications.show({ message: t("Page marked as obsolete") });
    },
  });
}

export function useVerificationListQuery(
  params?: IVerificationListParams
): UseQueryResult<IPagination<IVerificationListItem>, Error> {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => getVerificationList(params),
    queryKey: ["verification-list", params],
  });
}
