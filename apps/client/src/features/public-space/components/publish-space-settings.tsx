import { ActionIcon, Group, Switch, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconExternalLink, IconWorld } from "@tabler/icons-react";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CopyTextButton from "@/components/common/copy.tsx";
import AppearanceSettings from "@/features/public-space/components/appearance-settings.tsx";
import {
  usePublicSpaceForSpaceQuery,
  usePublishSpaceMutation,
} from "@/features/public-space/queries/public-space-query.ts";
import { IPublicSpace } from "@/features/public-space/types/public-space.types.ts";
import { isPublicSpacesAllowed } from "@/features/public-space/utils/public-space-access.ts";
import { ISpace } from "@/features/space/types/space.types.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { getAppUrl } from "@/lib/config.ts";

type PublishSpaceSettingsProps = {
  space: ISpace;
};

export default function PublishSpaceSettings({
  space,
}: PublishSpaceSettingsProps) {
  const { t } = useTranslation();
  const [workspace] = useAtom(workspaceAtom);

  const allowPublicSpaces = isPublicSpacesAllowed(workspace);

  const { data: publicSpace } = usePublicSpaceForSpaceQuery(
    allowPublicSpaces ? space?.id : undefined
  );
  const publishMutation = usePublishSpaceMutation();

  const [published, setPublished] = useState(false);
  const [searchIndexing, setSearchIndexing] = useState(false);
  const [bylineAuthor, setBylineAuthor] = useState(false);
  const [bylineUpdatedAt, setBylineUpdatedAt] = useState(true);
  const [directoryListed, setDirectoryListed] = useState(false);

  const workspaceDirectoryEnabled =
    workspace?.settings?.publicSpaces?.directory === true;

  const syncFromPublicSpace = (state?: IPublicSpace | null) => {
    const byline = state?.settings?.byline;
    setPublished(state?.enabled === true);
    setSearchIndexing(state?.searchIndexing === true);
    setBylineAuthor(byline?.author === true);
    setBylineUpdatedAt(byline?.updatedAt !== false);
    setDirectoryListed(state?.settings?.directory === true);
  };

  useEffect(() => {
    syncFromPublicSpace(publicSpace);
  }, [publicSpace]);

  if (!(allowPublicSpaces && space)) {
    return null;
  }

  const publicUrl = `${getAppUrl()}/docs/${space.slug}`;

  const applyPublish = async (enabled: boolean) => {
    try {
      const result = await publishMutation.mutateAsync({
        enabled,
        spaceId: space.id,
      });
      syncFromPublicSpace(result);
    } catch {
      // error handled by mutation
    }
  };

  const handlePublishChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    if (!value) {
      applyPublish(false);
      return;
    }

    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t(
            "Anyone on the internet will be able to read every page in this space, except restricted pages. Are you sure?"
          )}
        </Text>
      ),
      labels: { cancel: t("Cancel"), confirm: t("Publish") },
      onConfirm: () => applyPublish(true),
      title: t("Publish space to the web"),
    });
  };

  const handleIndexingChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked;
    try {
      await publishMutation.mutateAsync({
        enabled: true,
        searchIndexing: value,
        spaceId: space.id,
      });
      setSearchIndexing(value);
    } catch {
      // error handled by mutation
    }
  };

  const handleBylineAuthorChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked;
    try {
      await publishMutation.mutateAsync({
        bylineAuthor: value,
        enabled: true,
        spaceId: space.id,
      });
      setBylineAuthor(value);
    } catch {
      // error handled by mutation
    }
  };

  const handleBylineUpdatedAtChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked;
    try {
      await publishMutation.mutateAsync({
        bylineUpdatedAt: value,
        enabled: true,
        spaceId: space.id,
      });
      setBylineUpdatedAt(value);
    } catch {
      // error handled by mutation
    }
  };

  const handleDirectoryChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked;
    try {
      await publishMutation.mutateAsync({
        directory: value,
        enabled: true,
        spaceId: space.id,
      });
      setDirectoryListed(value);
    } catch {
      // error handled by mutation
    }
  };

  return (
    <div>
      <Group gap="xl" justify="space-between" mt="md" wrap="nowrap">
        <div>
          <Text size="md">{t("Publish space to the web")}</Text>
          <Text c="dimmed" size="sm">
            {t("Make this space publicly readable by anyone on the internet.")}
          </Text>
        </div>
        <Switch
          aria-label={t("Toggle publish space to the web")}
          checked={published}
          onChange={handlePublishChange}
          size={"xs"}
        />
      </Group>

      {published && (
        <>
          <Group gap="xl" justify="space-between" mt="md" wrap="nowrap">
            <div>
              <Text size="md">{t("Allow search engines to index")}</Text>
              <Text c="dimmed" size="sm">
                {t(
                  "Let public pages in this space appear in search engine results."
                )}
              </Text>
            </div>
            <Switch
              aria-label={t("Toggle search engine indexing")}
              checked={searchIndexing}
              onChange={handleIndexingChange}
              size={"xs"}
            />
          </Group>

          <Group gap="xl" justify="space-between" mt="md" wrap="nowrap">
            <div>
              <Text size="md">{t("Show page author")}</Text>
              <Text c="dimmed" size="sm">
                {t("Display the page creator's name on public pages.")}
              </Text>
            </div>
            <Switch
              aria-label={t("Toggle show page author")}
              checked={bylineAuthor}
              onChange={handleBylineAuthorChange}
              size={"xs"}
            />
          </Group>

          <Group gap="xl" justify="space-between" mt="md" wrap="nowrap">
            <div>
              <Text size="md">{t("Show last updated")}</Text>
              <Text c="dimmed" size="sm">
                {t("Display when each page was last updated.")}
              </Text>
            </div>
            <Switch
              aria-label={t("Toggle show last updated")}
              checked={bylineUpdatedAt}
              onChange={handleBylineUpdatedAtChange}
              size={"xs"}
            />
          </Group>

          {workspaceDirectoryEnabled && (
            <Group gap="xl" justify="space-between" mt="md" wrap="nowrap">
              <div>
                <Text size="md">{t("Show in public directory")}</Text>
                <Text c="dimmed" size="sm">
                  {t("List this space in the public directory at /docs.")}
                </Text>
              </div>
              <Switch
                aria-label={t("Toggle show in public directory")}
                checked={directoryListed}
                onChange={handleDirectoryChange}
                size={"xs"}
              />
            </Group>
          )}

          <Group gap={4} mt="md" wrap="nowrap">
            <TextInput
              aria-label={t("Public space link")}
              leftSection={<IconWorld size={16} />}
              readOnly
              rightSection={
                <CopyTextButton
                  label={t("Copy public space link")}
                  text={publicUrl}
                />
              }
              style={{ width: "100%" }}
              value={publicUrl}
            />
            <ActionIcon
              aria-label={t("Open public space link")}
              component="a"
              href={publicUrl}
              size="input-sm"
              target="_blank"
              variant="default"
            >
              <IconExternalLink size={16} />
            </ActionIcon>
          </Group>

          <Text c="dimmed" mt="xs" size="sm">
            {t("Renaming the space slug will break public links.")}
          </Text>

          <AppearanceSettings
            appearance={publicSpace?.settings?.appearance}
            spaceId={space.id}
          />
        </>
      )}
    </div>
  );
}
