import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route.ts";
import { getAppUrl, getServerAppUrl, isCloud } from "@/lib/config.ts";

export const useRedirectToCloudSelect = () => {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  useEffect(() => {
    const pathsToRedirect = ["/login", "/home"];
    if (isCloud() && pathsToRedirect.includes(pathname)) {
      const frontendUrl = getAppUrl();
      const serverUrl = getServerAppUrl();
      if (frontendUrl === serverUrl) {
        navigate(APP_ROUTE.AUTH.SELECT_WORKSPACE);
      }
    }
  }, [navigate]);
};
