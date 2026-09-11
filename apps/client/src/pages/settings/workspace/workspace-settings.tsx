import { Divider } from "@mantine/core";
import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";

import AllowPublicSpaces from "@/features/workspace/components/settings/components/allow-public-spaces.tsx";
import WorkspaceDefaultPageEditMode from "@/features/workspace/components/settings/components/workspace-default-page-edit-mode.tsx";
import WorkspaceIcon from "@/features/workspace/components/settings/components/workspace-icon.tsx";
import WorkspaceNameForm from "@/features/workspace/components/settings/components/workspace-name-form";
import { isBetaPublicSpaces } from "@/lib/config.ts";

export default function WorkspaceSettings() {
  const { t } = useTranslation();
  return (
    <>
      <DocumentTitle title="Workspace Settings" />
      <SettingsTitle title={t("General")} />
      <WorkspaceIcon />
      <WorkspaceNameForm />

      <Divider my="md" />

      <Divider my="md" />

      {isBetaPublicSpaces() && (
        <>
          <Divider my="md" />
          <AllowPublicSpaces />
        </>
      )}

      <Divider my="md" />
      <WorkspaceDefaultPageEditMode />
    </>
  );
}
