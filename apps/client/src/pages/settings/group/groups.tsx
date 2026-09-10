import { Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import CreateGroupModal from "@/features/group/components/create-group-modal";
import GroupList from "@/features/group/components/group-list";
import useUserRole from "@/hooks/use-user-role.tsx";

export default function Groups() {
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();

  return (
    <>
      <DocumentTitle title={t("Groups")} />
      <SettingsTitle title={t("Groups")} />

      <Group justify="flex-end" my="md">
        {isAdmin && <CreateGroupModal />}
      </Group>

      <GroupList />
    </>
  );
}
