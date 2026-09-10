import { Divider } from "@mantine/core";
import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import ManageHostname from "@/ee/components/manage-hostname.tsx";
import PersonalSpacesSetting from "@/ee/personal-space/components/personal-spaces-setting.tsx";
import AllowMemberTemplates from "@/ee/security/components/allow-member-templates.tsx";
import AllowPublicSpaces from "@/features/workspace/components/settings/components/allow-public-spaces.tsx";
import WorkspaceDefaultPageEditMode from "@/features/workspace/components/settings/components/workspace-default-page-edit-mode.tsx";
import WorkspaceIcon from "@/features/workspace/components/settings/components/workspace-icon.tsx";
import WorkspaceNameForm from "@/features/workspace/components/settings/components/workspace-name-form";
import { isBetaPublicSpaces, isCloud } from "@/lib/config.ts";

export default function WorkspaceSettings() {
  const { t } = useTranslation();
  return (
    <>
      <DocumentTitle title="Workspace Settings" />
      <SettingsTitle title={t("General")} />
      <WorkspaceIcon />
      <WorkspaceNameForm />

      <Divider my="md" />
      <AllowMemberTemplates />

      <Divider my="md" />
      <PersonalSpacesSetting />

      {isBetaPublicSpaces() && (
        <>
          <Divider my="md" />
          <AllowPublicSpaces />
        </>
      )}

      {isCloud() && (
        <>
          <Divider my="md" />
          <ManageHostname />
        </>
      )}

      <Divider my="md" />
      <WorkspaceDefaultPageEditMode />
    </>
  );
}
