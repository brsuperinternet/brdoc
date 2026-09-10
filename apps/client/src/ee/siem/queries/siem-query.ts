import { notifications } from "@mantine/notifications";
import {
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  createSiemDestination,
  deleteSiemDestination,
  getSiemDestinations,
  retrySiemDestination,
  testSiemDestination,
  updateSiemDestination,
} from "@/ee/siem/services/siem-service";
import {
  ISiemDestination,
  ISiemDestinationInput,
  ISiemTestResult,
  ITestSiemDestinationInput,
  IUpdateSiemDestinationInput,
} from "@/ee/siem/types/siem.types";

export const SIEM_DESTINATIONS_KEY = ["siem-destinations"];

export function extractErrorMessage(error: Error): string {
  const data = (error as any)?.response?.data;
  const message = data?.message ?? error.message;
  return Array.isArray(message) ? message.join(", ") : String(message);
}

function showError(error: Error) {
  notifications.show({ color: "red", message: extractErrorMessage(error) });
}

function isForbidden(error: unknown): boolean {
  return (
    (error as { response?: { status?: number } })?.response?.status === 403
  );
}

export function useSiemDestinationsQuery(
  enabled = true
): UseQueryResult<ISiemDestination[], Error> {
  return useQuery({
    enabled,
    queryFn: getSiemDestinations,
    queryKey: SIEM_DESTINATIONS_KEY,
    refetchInterval: (query) =>
      query.state.status === "error" ? false : 15_000,
    retry: (failureCount, error) => !isForbidden(error) && failureCount < 2,
  });
}

function useInvalidateDestinations() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: SIEM_DESTINATIONS_KEY });
}

export function useCreateSiemDestinationMutation() {
  const { t } = useTranslation();
  const invalidate = useInvalidateDestinations();
  return useMutation<ISiemDestination, Error, ISiemDestinationInput>({
    mutationFn: createSiemDestination,
    onError: showError,
    onSuccess: () => {
      notifications.show({ message: t("Destination created") });
      invalidate();
    },
  });
}

export function useUpdateSiemDestinationMutation() {
  const { t } = useTranslation();
  const invalidate = useInvalidateDestinations();
  return useMutation<ISiemDestination, Error, IUpdateSiemDestinationInput>({
    mutationFn: updateSiemDestination,
    onError: showError,
    onSuccess: () => {
      notifications.show({ message: t("Destination updated") });
      invalidate();
    },
  });
}

export function useDeleteSiemDestinationMutation() {
  const { t } = useTranslation();
  const invalidate = useInvalidateDestinations();
  return useMutation<void, Error, { destinationId: string }>({
    mutationFn: deleteSiemDestination,
    onError: showError,
    onSuccess: () => {
      notifications.show({ message: t("Destination deleted") });
      invalidate();
    },
  });
}

export function useRetrySiemDestinationMutation() {
  const { t } = useTranslation();
  const invalidate = useInvalidateDestinations();
  return useMutation<void, Error, { destinationId: string }>({
    mutationFn: retrySiemDestination,
    onError: showError,
    onSuccess: () => {
      notifications.show({ message: t("Retry scheduled") });
      invalidate();
    },
  });
}

export function useTestSiemDestinationMutation() {
  return useMutation<ISiemTestResult, Error, ITestSiemDestinationInput>({
    mutationFn: testSiemDestination,
    onError: showError,
  });
}
