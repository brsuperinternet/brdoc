import {
  ActionIcon,
  Anchor,
  Button,
  Group,
  Indicator,
  Popover,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { IconExternalLink, IconLock, IconWorld } from "@tabler/icons-react";
import { useAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import CopyTextButton from "@/components/common/copy.tsx";
import useTrial from "@/ee/hooks/use-trial.tsx";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { usePageQuery } from "@/features/page/queries/page-query.ts";
import classes from "@/features/share/components/share.module.css";
import {
  useCreateShareMutation,
  useDeleteShareMutation,
  useShareForPageQuery,
  useUpdateShareMutation,
} from "@/features/share/queries/share-query.ts";
import { useSpaceQuery } from "@/features/space/queries/space-query.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { extractPageSlugId, getPageIcon } from "@/lib";
import { getAppUrl, isCloud } from "@/lib/config.ts";

interface ShareModalProps {
  readOnly: boolean;
}
export default function ShareModal({ readOnly }: ShareModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pageSlug } = useParams();
  const pageSlugId = extractPageSlugId(pageSlug);
  const { data: page } = usePageQuery({ pageId: pageSlugId });
  const pageId = page?.id;
  const { data: share } = useShareForPageQuery(pageId);
  const { spaceSlug } = useParams();
  const { isTrial } = useTrial();
  const [workspace] = useAtom(workspaceAtom);
  const { data: space } = useSpaceQuery(spaceSlug);
  const workspaceDisabled = workspace?.settings?.sharing?.disabled === true;
  const spaceDisabled = space?.settings?.sharing?.disabled === true;
  const sharingDisabled = workspaceDisabled || spaceDisabled;
  const createShareMutation = useCreateShareMutation();
  const updateShareMutation = useUpdateShareMutation();
  const deleteShareMutation = useDeleteShareMutation();
  // pageIsShared means that the share exists and its level equals zero.
  const pageIsShared = share && share.level === 0;
  // if level is greater than zero, then it is a descendant page from a shared page
  const isDescendantShared = share && share.level > 0;

  const publicLink = `${getAppUrl()}/share/${share?.key}/p/${pageSlug}`;

  const [isPagePublic, setIsPagePublic] = useState<boolean>(false);
  useEffect(() => {
    if (share) {
      setIsPagePublic(true);
    } else {
      setIsPagePublic(false);
    }
  }, [share, pageId]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    setIsPagePublic(value);

    try {
      if (value) {
        await createShareMutation.mutateAsync({
          includeSubPages: true,
          pageId,
          searchIndexing: false,
        });
      } else if (share && share.id) {
        await deleteShareMutation.mutateAsync(share.id);
      }
    } catch {
      setIsPagePublic(!value);
    }
  };

  const handleSubPagesChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked;
    try {
      await updateShareMutation.mutateAsync({
        includeSubPages: value,
        shareId: share.id,
      });
    } catch {
      // query invalidation will revert the UI
    }
  };

  const handleIndexSearchChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked;
    try {
      await updateShareMutation.mutateAsync({
        searchIndexing: value,
        shareId: share.id,
      });
    } catch {
      // query invalidation will revert the UI
    }
  };

  const shareLink = useMemo(
    () => (
      <Group gap={4} my="sm" wrap="nowrap">
        <TextInput
          readOnly
          rightSection={<CopyTextButton text={publicLink} />}
          style={{ width: "100%" }}
          value={publicLink}
          variant="filled"
        />
        <ActionIcon
          component="a"
          href={publicLink}
          size="sm"
          target="_blank"
          variant="default"
        >
          <IconExternalLink size={16} />
        </ActionIcon>
      </Group>
    ),
    [publicLink]
  );

  return (
    <Popover position="bottom" shadow="md" width={350} withArrow>
      <Popover.Target>
        <Button
          color="dark"
          leftSection={
            <Indicator
              color="green"
              disabled={!isPagePublic}
              offset={5}
              withBorder
            >
              <IconWorld size={20} stroke={1.5} />
            </Indicator>
          }
          size="compact-sm"
          variant="subtle"
        >
          {t("Share")}
        </Button>
      </Popover.Target>
      <Popover.Dropdown style={{ userSelect: "none" }}>
        {isCloud() && isTrial ? (
          <>
            <Group justify="center" mb="sm">
              <IconLock size={20} stroke={1.5} />
            </Group>
            <Text fw={500} mb="xs" size="sm" ta="center">
              {t("Upgrade to share pages")}
            </Text>
            <Text c="dimmed" mb="sm" size="sm" ta="center">
              {t(
                "Page sharing is available on paid plans. Upgrade to share your pages publicly."
              )}
            </Text>
            <Button
              fullWidth
              onClick={() => navigate("/settings/billing")}
              size="xs"
            >
              {t("Upgrade Plan")}
            </Button>
          </>
        ) : sharingDisabled ? (
          <>
            <Group justify="center" mb="sm">
              <IconLock size={20} stroke={1.5} />
            </Group>
            <Text fw={500} mb="xs" size="sm" ta="center">
              {t("Public sharing is disabled")}
            </Text>
            <Text c="dimmed" size="sm" ta="center">
              {workspaceDisabled
                ? t("Public sharing has been disabled at the workspace level.")
                : t("Public sharing has been disabled for this space.")}
            </Text>
          </>
        ) : isDescendantShared ? (
          <>
            <Text size="sm">{t("Inherits public sharing from")}</Text>
            <Anchor
              component={Link}
              size="sm"
              style={{
                color: "var(--mantine-color-text)",
                cursor: "pointer",
              }}
              to={buildPageUrl(
                spaceSlug,
                share.sharedPage.slugId,
                share.sharedPage.title
              )}
              underline="never"
            >
              <Group gap="4" my="sm" wrap="nowrap">
                {getPageIcon(share.sharedPage.icon)}
                <div className={classes.shareLinkText}>
                  <Text fw={500} fz="sm" lineClamp={1}>
                    {share.sharedPage.title || t("untitled")}
                  </Text>
                </div>
              </Group>
            </Anchor>

            {shareLink}
          </>
        ) : (
          <>
            <Group gap="xl" justify="space-between" wrap="nowrap">
              <div>
                <Text size="sm">
                  {isPagePublic ? t("Shared to web") : t("Share to web")}
                </Text>
                <Text c="dimmed" size="xs">
                  {isPagePublic
                    ? t("Anyone with the link can view this page")
                    : t("Make this page publicly accessible")}
                </Text>
              </div>
              <Switch
                defaultChecked={isPagePublic}
                disabled={readOnly}
                onChange={handleChange}
                size="xs"
              />
            </Group>

            {pageIsShared && (
              <>
                {shareLink}
                <Group gap="xl" justify="space-between" wrap="nowrap">
                  <div>
                    <Text size="sm">{t("Include sub-pages")}</Text>
                    <Text c="dimmed" size="xs">
                      {t("Make sub-pages public too")}
                    </Text>
                  </div>

                  <Switch
                    checked={share.includeSubPages}
                    disabled={readOnly}
                    onChange={handleSubPagesChange}
                    size="xs"
                  />
                </Group>
                <Group gap="xl" justify="space-between" mt="sm" wrap="nowrap">
                  <div>
                    <Text size="sm">{t("Search engine indexing")}</Text>
                    <Text c="dimmed" size="xs">
                      {t("Allow search engines to index page")}
                    </Text>
                  </div>
                  <Switch
                    checked={share.searchIndexing}
                    disabled={readOnly}
                    onChange={handleIndexSearchChange}
                    size="xs"
                  />
                </Group>
              </>
            )}
          </>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
