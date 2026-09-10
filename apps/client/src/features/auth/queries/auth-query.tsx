import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getCollabToken, verifyUserToken } from "../services/auth-service";
import { ICollabToken, IVerifyUserToken } from "../types/auth.types";

export function useVerifyUserTokenQuery(
  verify: IVerifyUserToken
): UseQueryResult<any, Error> {
  return useQuery({
    enabled: !!verify.token,
    queryFn: () => verifyUserToken(verify),
    queryKey: ["verify-token", verify],
    staleTime: 0,
  });
}

export function useCollabToken(): UseQueryResult<ICollabToken, Error> {
  return useQuery({
    queryFn: () => getCollabToken(),
    queryKey: ["collab-token"],
    //refetchInterval: 12 * 60 * 60 * 1000, // 12hrs
    //refetchIntervalInBackground: true,
    refetchOnMount: true,
    //@ts-expect-error
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response.status === 404) {
        return false;
      }
      return 10;
    },
    retryDelay: (retryAttempt) => {
      // Exponential backoff: 5s, 10s, 20s, etc.
      return 5000 * 2 ** (retryAttempt - 1);
    },
    staleTime: 20 * 60 * 60 * 1000, //20hrs
  });
}
