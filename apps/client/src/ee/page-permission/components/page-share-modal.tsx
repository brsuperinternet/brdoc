import {
  Button,
  Center,
  Indicator,
  Loader,
  Modal,
  Stack,
  Tabs,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLock, IconWorld } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { PagePermissionTab } from "@/ee/page-permission";
import { usePageRestrictionInfoQuery } from "@/ee/page-permission/queries/page-permission-query";
import { usePageQuery } from "@/features/page/queries/page-query";
import { useShareForPageQuery } from "@/features/share/queries/share-query";
import { useSpaceQuery } from "@/features/space/queries/space-query";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom";
import { extractPageSlugId } from "@/lib";
import { PublishTab } from "./publish-tab";

type PageShareModalProps = {
  readOnly?: boolean;
};

export function PageShareModal({ readOnly }: PageShareModalProps) {
  const { t } = useTranslation();
  const { pageSlug, spaceSlug } = useParams();
  const pageSlugId = extractPageSlugId(pageSlug);
  const [opened, { open, close }] = useDisclosure(false);
  const hasPagePermissions = useHasFeature(Feature.PAGE_PERMISSIONS);
  const [activeTab, setActiveTab] = useState<string | null>(
    hasPagePermissions ? "access" : "publish"
  );

  const [workspace] = useAtom(workspaceAtom);
  const { data: space } = useSpaceQuery(spaceSlug);
  const workspaceSharingDisabled =
    workspace?.settings?.sharing?.disabled === true;
  const spaceSharingDisabled = space?.settings?.sharing?.disabled === true;

  const { data: page } = usePageQuery({ pageId: pageSlugId });
  const pageId = page?.id;
  const isRestricted = page?.permissions?.hasRestriction ?? false;

  const { data: share } = useShareForPageQuery(pageId);
  const isPubliclyShared = !!share;

  const { data: restrictionInfo, isLoading: restrictionLoading } =
    usePageRestrictionInfoQuery(
      opened && hasPagePermissions ? pageId : undefined
    );

  return (
    <>
      <Button
        leftSection={
          isRestricted ? (
            <Indicator color="red" offset={5} withBorder>
              <IconLock size={20} stroke={1.5} />
            </Indicator>
          ) : isPubliclyShared ? (
            <Indicator color="green" offset={5} withBorder>
              <IconWorld size={20} stroke={1.5} />
            </Indicator>
          ) : null
        }
        onClick={() => {
          setActiveTab(
            isPubliclyShared
              ? "publish"
              : hasPagePermissions
                ? "access"
                : "publish"
          );
          open();
        }}
        size="compact-sm"
        style={{ border: "none" }}
        variant="default"
      >
        {t("Share")}
      </Button>

      <Modal
        closeButtonProps={{ "aria-label": t("Close") }}
        onClose={close}
        opened={opened}
        size={600}
        title={t("Share")}
      >
        <Tabs color="dark" onChange={setActiveTab} value={activeTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="access">{t("Access")}</Tabs.Tab>
            <Tabs.Tab
              rightSection={
                isPubliclyShared ? (
                  <Indicator color="green" processing size={8} />
                ) : null
              }
              value="publish"
            >
              {t("Publish")}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="access">
            {hasPagePermissions ? (
              restrictionLoading || !pageId || !restrictionInfo ? (
                <Center py="xl">
                  <Loader size="sm" />
                </Center>
              ) : (
                <PagePermissionTab
                  pageId={pageId}
                  restrictionInfo={restrictionInfo}
                />
              )
            ) : (
              <Stack align="center" py="md">
                <IconLock size={20} stroke={1.5} />
                <Text fw={500} size="sm" ta="center">
                  {t("Page permissions")}
                </Text>
                <Text c="dimmed" size="sm" ta="center">
                  {t(
                    "Control who can view and edit individual pages. Available with an enterprise license."
                  )}
                </Text>
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="publish">
            <PublishTab
              isRestricted={isRestricted}
              pageId={pageId}
              readOnly={readOnly}
              spaceSharingDisabled={spaceSharingDisabled}
              workspaceSharingDisabled={workspaceSharingDisabled}
            />
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  );
}
