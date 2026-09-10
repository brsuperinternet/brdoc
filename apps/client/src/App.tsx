import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/layouts/global/layout.tsx";
import { Error404 } from "@/components/ui/error-404.tsx";
import { useRedirectToCloudSelect } from "@/ee/hooks/use-redirect-to-cloud-select.tsx";
import { useTrackOrigin } from "@/hooks/use-track-origin";
import { isCloud } from "@/lib/config.ts";

const SetupWorkspace = lazy(() => import("@/pages/auth/setup-workspace.tsx"));
const LoginPage = lazy(() => import("@/pages/auth/login"));
const Home = lazy(() => import("@/pages/dashboard/home"));
const Page = lazy(() => import("@/pages/page/page"));
const AccountSettings = lazy(
  () => import("@/pages/settings/account/account-settings")
);
const WorkspaceMembers = lazy(
  () => import("@/pages/settings/workspace/workspace-members")
);
const WorkspaceSettings = lazy(
  () => import("@/pages/settings/workspace/workspace-settings")
);
const Groups = lazy(() => import("@/pages/settings/group/groups"));
const GroupInfo = lazy(() => import("./pages/settings/group/group-info"));
const Spaces = lazy(() => import("@/pages/settings/space/spaces.tsx"));
const AccountPreferences = lazy(
  () => import("@/pages/settings/account/account-preferences.tsx")
);
const SpaceHome = lazy(() => import("@/pages/space/space-home.tsx"));
const PageRedirect = lazy(() => import("@/pages/page/page-redirect.tsx"));
const InviteSignup = lazy(() => import("@/pages/auth/invite-signup.tsx"));
const ForgotPassword = lazy(() => import("@/pages/auth/forgot-password.tsx"));
const PasswordReset = lazy(() => import("./pages/auth/password-reset"));
const Billing = lazy(() => import("@/ee/billing/pages/billing.tsx"));
const CloudLogin = lazy(() => import("@/ee/pages/cloud-login.tsx"));
const CreateWorkspace = lazy(() => import("@/ee/pages/create-workspace.tsx"));
const Security = lazy(() => import("@/ee/security/pages/security.tsx"));
const License = lazy(() => import("@/ee/licence/pages/license.tsx"));
const SharedPage = lazy(() => import("@/pages/share/shared-page.tsx"));
const PdfRenderPage = lazy(() => import("@/ee/pdf-export/pdf-render-page.tsx"));
const Shares = lazy(() => import("@/pages/settings/shares/shares.tsx"));
const ShareLayout = lazy(
  () => import("@/features/share/components/share-layout.tsx")
);
const ShareRedirect = lazy(() => import("@/pages/share/share-redirect.tsx"));
const PublicSpacePage = lazy(
  () => import("@/pages/public-space/public-space-page.tsx")
);
const PublicSpaceLayout = lazy(
  () => import("@/features/public-space/components/public-space-layout.tsx")
);
const PublicSpaceDirectoryPage = lazy(
  () => import("@/pages/public-space/public-space-directory-page.tsx")
);
const SpacesPage = lazy(() => import("@/pages/spaces/spaces.tsx"));
const MfaChallengePage = lazy(() =>
  import("@/ee/mfa/pages/mfa-challenge-page").then((m) => ({
    default: m.MfaChallengePage,
  }))
);
const MfaSetupRequiredPage = lazy(() =>
  import("@/ee/mfa/pages/mfa-setup-required-page").then((m) => ({
    default: m.MfaSetupRequiredPage,
  }))
);
const SpaceTrash = lazy(() => import("@/pages/space/space-trash.tsx"));
const UserApiKeys = lazy(() => import("@/ee/api-key/pages/user-api-keys"));
const WorkspaceApiKeys = lazy(
  () => import("@/ee/api-key/pages/workspace-api-keys")
);
const AiSettings = lazy(() => import("@/ee/ai/pages/ai-settings.tsx"));
const BasePage = lazy(() => import("@/ee/base/pages/base-page.tsx"));
const AuditLogs = lazy(() => import("@/ee/audit/pages/audit-logs.tsx"));
const VerifiedPages = lazy(
  () => import("@/ee/page-verification/pages/verified-pages.tsx")
);
const TemplateList = lazy(() => import("@/ee/template/pages/template-list"));
const TemplateEditor = lazy(
  () => import("@/ee/template/pages/template-editor")
);
const FavoritesPage = lazy(() => import("@/pages/favorites/favorites-page"));
const AiChat = lazy(() => import("@/ee/ai-chat/pages/ai-chat.tsx"));
const VerifyEmail = lazy(() => import("@/ee/pages/verify-email.tsx"));
const LabelPage = lazy(() => import("@/pages/label/label-page"));
const OAuthConsent = lazy(() => import("@/ee/oauth/pages/oauth-consent.tsx"));

export default function App() {
  const { t } = useTranslation();
  useRedirectToCloudSelect();
  useTrackOrigin();

  useEffect(() => {
    // warm the editor chunk so opening a page doesn't wait on the network
    const timer = setTimeout(() => import("@/pages/page/page"), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<Navigate to="/home" />} index />
        <Route element={<LoginPage />} path={"/login"} />
        <Route element={<InviteSignup />} path={"/invites/:invitationId"} />
        <Route element={<ForgotPassword />} path={"/forgot-password"} />
        <Route element={<PasswordReset />} path={"/password-reset"} />
        <Route element={<MfaChallengePage />} path={"/login/mfa"} />
        <Route element={<MfaSetupRequiredPage />} path={"/login/mfa/setup"} />
        <Route element={<OAuthConsent />} path={"/oauth/consent"} />

        {!isCloud() && (
          <Route element={<SetupWorkspace />} path={"/setup/register"} />
        )}

        {isCloud() && (
          <>
            <Route element={<CreateWorkspace />} path={"/create"} />
            <Route element={<CloudLogin />} path={"/select"} />
            <Route element={<VerifyEmail />} path={"/verify-email"} />
          </>
        )}

        <Route element={<ShareLayout />}>
          <Route
            element={<SharedPage />}
            path={"/share/:shareId/p/:pageSlug"}
          />
          <Route element={<SharedPage />} path={"/share/p/:pageSlug"} />
        </Route>

        <Route element={<PublicSpaceDirectoryPage />} path={"/docs"} />
        <Route element={<PublicSpaceLayout />}>
          <Route element={<PublicSpacePage />} path={"/docs/:spaceSlug"} />
          <Route
            element={<PublicSpacePage />}
            path={"/docs/:spaceSlug/:pageSlug"}
          />
        </Route>

        <Route element={<PdfRenderPage />} path={"/pdf-render/:pageId"} />
        <Route element={<ShareRedirect />} path={"/share/:shareId"} />
        <Route element={<PageRedirect />} path={"/p/:pageSlug"} />

        <Route element={<Layout />}>
          <Route element={<Home />} path={"/home"} />
          <Route element={<AiChat />} path={"/ai"} />
          <Route element={<AiChat />} path={"/ai/chat/:chatId"} />
          <Route element={<SpacesPage />} path={"/spaces"} />
          <Route element={<FavoritesPage />} path={"/favorites"} />
          <Route element={<LabelPage />} path={"/labels/:labelName"} />
          <Route element={<TemplateList />} path={"/templates"} />
          <Route element={<TemplateEditor />} path={"/templates/:templateId"} />
          <Route element={<SpaceHome />} path={"/s/:spaceSlug"} />
          <Route element={<SpaceTrash />} path={"/s/:spaceSlug/trash"} />
          <Route element={<Page />} path={"/s/:spaceSlug/p/:pageSlug"} />

          <Route element={<BasePage />} path={"/base/:pageId"} />

          <Route path={"/settings"}>
            <Route element={<AccountSettings />} path={"account/profile"} />
            <Route
              element={<AccountPreferences />}
              path={"account/preferences"}
            />
            <Route element={<UserApiKeys />} path={"account/api-keys"} />
            <Route
              element={<UserApiKeys />}
              path={"account/api-keys/authorized-apps"}
            />
            <Route element={<WorkspaceSettings />} path={"workspace"} />
            <Route element={<WorkspaceMembers />} path={"members"} />
            <Route element={<WorkspaceApiKeys />} path={"api-keys"} />
            <Route element={<Groups />} path={"groups"} />
            <Route element={<GroupInfo />} path={"groups/:groupId"} />
            <Route element={<Spaces />} path={"spaces"} />
            <Route element={<Shares />} path={"sharing"} />
            <Route element={<Security />} path={"security"} />
            <Route element={<AiSettings />} path={"ai"} />
            <Route element={<AiSettings />} path={"ai/mcp"} />
            <Route element={<AuditLogs />} path={"audit"} />
            <Route element={<AuditLogs />} path={"audit/siem"} />
            <Route
              element={<Navigate replace to="/settings/audit/siem" />}
              path={"siem"}
            />
            <Route element={<VerifiedPages />} path={"verifications"} />
            {!isCloud() && <Route element={<License />} path={"license"} />}
            {isCloud() && <Route element={<Billing />} path={"billing"} />}
          </Route>
        </Route>

        <Route element={<Error404 />} path="*" />
      </Routes>
    </Suspense>
  );
}
