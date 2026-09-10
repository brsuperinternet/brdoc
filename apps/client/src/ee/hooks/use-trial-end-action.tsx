import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useTrial from "@/ee/hooks/use-trial.tsx";
import useUserRole from "@/hooks/use-user-role.tsx";
import APP_ROUTE from "@/lib/app-route.ts";
import { getBillingTrialDays, isCloud } from "@/lib/config.ts";

export const useTrialEndAction = () => {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const { isAdmin } = useUserRole();
  const { trialDaysLeft } = useTrial();

  useEffect(() => {
    if (isCloud() && trialDaysLeft === 0 && !pathname.startsWith("/settings")) {
      notifications.show({
        autoClose: false,
        color: "red",
        message:
          "Please upgrade to a paid plan or contact your workspace admin.",
        position: "top-right",
        title: `Your ${getBillingTrialDays()}-day trial has ended`,
      });

      // only admins can access the billing page
      if (isAdmin) {
        navigate(APP_ROUTE.SETTINGS.WORKSPACE.BILLING);
      } else {
        navigate(APP_ROUTE.SETTINGS.ACCOUNT.PROFILE);
      }
    }
  }, [navigate]);
};
