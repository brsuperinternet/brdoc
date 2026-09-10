import { Alert, Tabs } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import PublishedSpacesList from "@/features/public-space/components/published-spaces-list.tsx";
import { isPublicSpacesAllowed } from "@/features/public-space/utils/public-space-access.ts";
import ShareList from "@/features/share/components/share-list.tsx";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";

export default function Shares() {
  const { t } = useTranslation();
  const [workspace] = useAtom(workspaceAtom);

  const allowPublicSpaces = isPublicSpacesAllowed(workspace);

  const sharedPages = (
    <>
      <Alert color="blue" icon={<IconInfoCircle />} variant="light">
        {t(
          "Publicly shared pages from spaces you are a member of will appear here"
        )}
      </Alert>

      <ShareList />
    </>
  );

  return (
    <>
      <DocumentTitle title={t("Public sharing")} />
      <SettingsTitle title={t("Public sharing")} />

      {allowPublicSpaces ? (
        <Tabs color="dark" defaultValue="pages">
          <Tabs.List>
            <Tabs.Tab fw={500} value="pages">
              {t("Shared pages")}
            </Tabs.Tab>
            <Tabs.Tab fw={500} value="spaces">
              {t("Published spaces")}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel pt="md" value="pages">
            {sharedPages}
          </Tabs.Panel>

          <Tabs.Panel pt="md" value="spaces">
            <Alert color="blue" icon={<IconInfoCircle />} variant="light">
              {t("Spaces published to the web will appear here")}
            </Alert>

            <PublishedSpacesList />
          </Tabs.Panel>
        </Tabs>
      ) : (
        sharedPages
      )}
    </>
  );
}
