import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCurrentUser from "@/features/user/hooks/use-current-user.ts";
import { getPostLoginRedirect } from "@/lib/app-route.ts";

export function useRedirectIfAuthenticated() {
  const { data, isLoading } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (data && data?.user) {
      navigate(getPostLoginRedirect());
    }
  }, [isLoading, data]);
}
