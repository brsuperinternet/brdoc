import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { Entitlements } from "./entitlement.types";
import { getEntitlements } from "./entitlement-service";

export function useEntitlements(): UseQueryResult<Entitlements> {
  return useQuery({
    queryFn: getEntitlements,
    queryKey: ["entitlements"],
    staleTime: 5 * 60 * 1000,
  });
}
