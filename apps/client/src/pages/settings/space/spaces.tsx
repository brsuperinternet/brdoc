import { Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import CreateSpaceModal from "@/features/space/components/create-space-modal.tsx";
import SpaceList from "@/features/space/components/space-list.tsx";
import useUserRole from "@/hooks/use-user-role.tsx";

export default function Spaces() {
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();

  return (
    <>
      <DocumentTitle title={t("Spaces")} />
      <SettingsTitle title={t("Spaces")} />

      <Group justify="flex-end" my="md">
        {isAdmin && <CreateSpaceModal />}
      </Group>

      <SpaceList />
    </>
  );
}
