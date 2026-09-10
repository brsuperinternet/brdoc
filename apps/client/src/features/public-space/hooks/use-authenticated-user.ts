import { useQuery } from "@tanstack/react-query";
import { getMyInfo } from "@/features/user/services/user-service";
import { ICurrentUser } from "@/features/user/types/user.types";

/** Probes login state from public surfaces; the /docs 401 exemption keeps anonymous visitors off the login redirect. */
export function useAuthenticatedUser(enabled = true) {
  return useQuery<ICurrentUser>({
    enabled,
    queryFn: getMyInfo,
    queryKey: ["currentUser"],
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
