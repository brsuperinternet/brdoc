import { UseQueryResult, useQuery } from "@tanstack/react-query";
import {
  getBilling,
  getBillingPlans,
} from "@/ee/billing/services/billing-service.ts";
import { IBilling, IBillingPlan } from "@/ee/billing/types/billing.types.ts";

export function useBillingQuery(): UseQueryResult<IBilling, Error> {
  return useQuery({
    queryFn: () => getBilling(),
    queryKey: ["billing"],
  });
}

export function useBillingPlans(): UseQueryResult<IBillingPlan[], Error> {
  return useQuery({
    queryFn: () => getBillingPlans(),
    queryKey: ["billing-plans"],
  });
}
