import { useAtom } from "jotai";
import { BillingPlan } from "@/ee/billing/types/billing.types.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";

const usePlan = () => {
  const [workspace] = useAtom(workspaceAtom);

  const isStandard =
    typeof workspace?.plan === "string" &&
    workspace?.plan.toLowerCase() === BillingPlan.STANDARD.toLowerCase();

  const isBusiness =
    typeof workspace?.plan === "string" &&
    workspace?.plan.toLowerCase() === BillingPlan.BUSINESS.toLowerCase();

  return { isBusiness, isStandard };
};

export default usePlan;
