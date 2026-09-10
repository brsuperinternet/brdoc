import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import GroupDetails from "@/features/group/components/group-details";
import GroupMembersList from "@/features/group/components/group-members";

export default function GroupInfo() {
  const { t } = useTranslation();

  return (
    <>
      <DocumentTitle title={t("Manage Group")} />
      <SettingsTitle title={t("Manage Group")} />
      <GroupDetails />
      <GroupMembersList />
    </>
  );
}
