import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { RESET } from "jotai/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  forgotPassword,
  login,
  logout,
  passwordReset,
  setupWorkspace,
  verifyUserToken,
} from "@/features/auth/services/auth-service";
import {
  IForgotPassword,
  ILogin,
  IPasswordReset,
  ISetupWorkspace,
  IVerifyUserToken,
} from "@/features/auth/types/auth.types";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import { acceptInvitation } from "@/features/workspace/services/workspace-service.ts";
import { IAcceptInvite } from "@/features/workspace/types/workspace.types.ts";
import APP_ROUTE, { getPostLoginRedirect } from "@/lib/app-route.ts";

export default function useAuth() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [, setCurrentUser] = useAtom(currentUserAtom);

  const handleSignIn = async (data: ILogin) => {
    setIsLoading(true);

    try {
      const response = await login(data);
      setIsLoading(false);

      // Check if MFA is required
      if (response.userHasMfa) {
        navigate(APP_ROUTE.AUTH.MFA_CHALLENGE + window.location.search);
      } else if (response.requiresMfaSetup) {
        navigate(APP_ROUTE.AUTH.MFA_SETUP_REQUIRED + window.location.search);
      } else {
        navigate(getPostLoginRedirect());
      }
    } catch (err) {
      setIsLoading(false);

      const message = err.response.data?.message;

      notifications.show({
        color: "red",
        message,
      });
    }
  };

  const handleInvitationSignUp = async (data: IAcceptInvite) => {
    setIsLoading(true);

    try {
      const response = await acceptInvitation(data);
      setIsLoading(false);

      if (response.requiresLogin) {
        notifications.show({
          message: t(
            "Account created successfully. Please log in to set up two-factor authentication."
          ),
        });
        navigate(APP_ROUTE.AUTH.LOGIN);
      } else {
        navigate(APP_ROUTE.HOME);
      }
    } catch (err) {
      setIsLoading(false);
      notifications.show({
        color: "red",
        message: err.response.data.message,
      });
    }
  };

  const handleSetupWorkspace = async (data: ISetupWorkspace) => {
    setIsLoading(true);

    try {
      await setupWorkspace(data);
      setIsLoading(false);
      navigate(APP_ROUTE.HOME);
    } catch (err) {
      setIsLoading(false);
      notifications.show({
        color: "red",
        message: err.response.data.message,
      });
    }
  };

  const handlePasswordReset = async (data: IPasswordReset) => {
    setIsLoading(true);

    try {
      const response = await passwordReset(data);
      setIsLoading(false);

      if (response.requiresLogin) {
        notifications.show({
          message: t(
            "Password reset was successful. Please log in with your new password."
          ),
        });
        navigate(APP_ROUTE.AUTH.LOGIN);
      } else {
        navigate(APP_ROUTE.HOME);
        notifications.show({
          message: t("Password reset was successful"),
        });
      }
    } catch (err) {
      setIsLoading(false);
      notifications.show({
        color: "red",
        message: err.response.data.message,
      });
    }
  };

  const handleLogout = async () => {
    setCurrentUser(RESET);
    await logout();
    window.location.replace(`${APP_ROUTE.AUTH.LOGIN}?logout=1`);
  };

  const handleForgotPassword = async (data: IForgotPassword) => {
    setIsLoading(true);

    try {
      await forgotPassword(data);
      setIsLoading(false);

      return true;
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      notifications.show({
        color: "red",
        message: err.response.data.message,
      });

      return false;
    }
  };

  const handleVerifyUserToken = async (data: IVerifyUserToken) => {
    setIsLoading(true);

    try {
      await verifyUserToken(data);
      setIsLoading(false);
    } catch (err) {
      console.log(err);
      setIsLoading(false);
      notifications.show({
        color: "red",
        message: err.response.data.message,
      });
    }
  };

  return {
    forgotPassword: handleForgotPassword,
    invitationSignup: handleInvitationSignUp,
    isLoading,
    logout: handleLogout,
    passwordReset: handlePasswordReset,
    setupWorkspace: handleSetupWorkspace,
    signIn: handleSignIn,
    verifyUserToken: handleVerifyUserToken,
  };
}
