import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "@/components/layouts/global/layout.tsx";
import { Error404 } from "@/components/ui/error-404.tsx";
import { useTrackOrigin } from "@/hooks/use-track-origin";

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

const SharedPage = lazy(() => import("@/pages/share/shared-page.tsx"));

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

const SpaceTrash = lazy(() => import("@/pages/space/space-trash.tsx"));

const FavoritesPage = lazy(() => import("@/pages/favorites/favorites-page"));
const LabelPage = lazy(() => import("@/pages/label/label-page"));

export default function App() {
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

        <Route element={<SetupWorkspace />} path={"/setup/register"} />

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

        <Route element={<ShareRedirect />} path={"/share/:shareId"} />
        <Route element={<PageRedirect />} path={"/p/:pageSlug"} />

        <Route element={<Layout />}>
          <Route element={<Home />} path={"/home"} />
          <Route element={<SpacesPage />} path={"/spaces"} />
          <Route element={<FavoritesPage />} path={"/favorites"} />
          <Route element={<LabelPage />} path={"/labels/:labelName"} />
          <Route element={<SpaceHome />} path={"/s/:spaceSlug"} />
          <Route element={<SpaceTrash />} path={"/s/:spaceSlug/trash"} />
          <Route element={<Page />} path={"/s/:spaceSlug/p/:pageSlug"} />

          <Route path={"/settings"}>
            <Route element={<AccountSettings />} path={"account/profile"} />
            <Route
              element={<AccountPreferences />}
              path={"account/preferences"}
            />
            <Route element={<WorkspaceSettings />} path={"workspace"} />
            <Route element={<WorkspaceMembers />} path={"members"} />
            <Route element={<Groups />} path={"groups"} />
            <Route element={<GroupInfo />} path={"groups/:groupId"} />
            <Route element={<Spaces />} path={"spaces"} />
            <Route element={<Shares />} path={"sharing"} />
          </Route>
        </Route>

        <Route element={<Error404 />} path="*" />
      </Routes>
    </Suspense>
  );
}
