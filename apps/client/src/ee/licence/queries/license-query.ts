import { notifications } from "@mantine/notifications";
import {
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  activateLicense,
  getLicenseInfo,
  removeLicense,
} from "@/ee/licence/services/license-service.ts";
import { ILicenseInfo } from "@/ee/licence/types/license.types.ts";

export function useLicenseInfo(): UseQueryResult<ILicenseInfo, Error> {
  return useQuery({
    queryFn: () => getLicenseInfo(),
    queryKey: ["license"],
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivateMutation() {
  const queryClient = useQueryClient();

  return useMutation<ILicenseInfo, Error, string>({
    mutationFn: (licenseKey) => activateLicense(licenseKey),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({ color: "red", message: errorMessage });
    },
    onSuccess: () => {
      notifications.show({ message: "License activated successfully" });
      queryClient.refetchQueries({
        queryKey: ["license"],
      });
      queryClient.refetchQueries({ queryKey: ["currentUser"] });
      queryClient.refetchQueries({ queryKey: ["entitlements"] });
    },
  });
}

export function useRemoveLicenseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => removeLicense(),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["license"] });
      queryClient.refetchQueries({ queryKey: ["currentUser"] });
      queryClient.refetchQueries({ queryKey: ["entitlements"] });
    },
  });
}
