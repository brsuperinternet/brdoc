import {
  ActionIcon,
  Anchor,
  Button,
  Group,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { IconExternalLink, IconLock } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import CopyTextButton from "@/components/common/copy";
import useTrial from "@/ee/hooks/use-trial";
import { buildPageUrl } from "@/features/page/page.utils";
import {
  useCreateShareMutation,
  useDeleteShareMutation,
  useShareForPageQuery,
  useUpdateShareMutation,
} from "@/features/share/queries/share-query";
import { getPageIcon } from "@/lib";
import { getAppUrl, isCloud } from "@/lib/config";

type PublishTabProps = {
  pageId: string;
  readOnly?: boolean;
  isRestricted?: boolean;
  workspaceSharingDisabled?: boolean;
  spaceSharingDisabled?: boolean;
};

export function PublishTab({
  pageId,
  readOnly,
  isRestricted,
  workspaceSharingDisabled,
  spaceSharingDisabled,
}: PublishTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pageSlug, spaceSlug } = useParams();
  const { isTrial } = useTrial();

  const { data: share } = useShareForPageQuery(pageId);
  const createShareMutation = useCreateShareMutation();
  const updateShareMutation = useUpdateShareMutation();
  const deleteShareMutation = useDeleteShareMutation();

  const pageIsShared = share && share.level === 0;
  const isDescendantShared = share && share.level > 0;

  const publicLink = `${getAppUrl()}/share/${share?.key}/p/${pageSlug}`;

  const [isPagePublic, setIsPagePublic] = useState<boolean>(false);

  useEffect(() => {
    setIsPagePublic(!!share);
  }, [share, pageId]);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;

    if (value) {
      createShareMutation.mutateAsync({
        includeSubPages: true,
        pageId,
        searchIndexing: false,
      });
      setIsPagePublic(value);
    } else if (share && share.id) {
      deleteShareMutation.mutateAsync(share.id);
      setIsPagePublic(value);
    }
  };

  const handleSubPagesChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked;
    updateShareMutation.mutateAsync({
      includeSubPages: value,
      shareId: share.id,
    });
  };

  const handleIndexSearchChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked;
    updateShareMutation.mutateAsync({
      searchIndexing: value,
      shareId: share.id,
    });
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

  if (isCloud() && isTrial) {
    return (
      <Stack align="center" py="md">
        <IconLock size={20} stroke={1.5} />
        <Text fw={500} size="sm" ta="center">
          {t("Upgrade to share pages")}
        </Text>
        <Text c="dimmed" size="sm" ta="center">
          {t(
            "Page sharing is available on paid plans. Upgrade to share your pages publicly."
          )}
        </Text>
        <Button onClick={() => navigate("/settings/billing")} size="xs">
          {t("Upgrade Plan")}
        </Button>
      </Stack>
    );
  }

  if (workspaceSharingDisabled || spaceSharingDisabled) {
    return (
      <Stack align="center" py="md">
        <IconLock size={20} stroke={1.5} />
        <Text fw={500} size="sm" ta="center">
          {t("Public sharing is disabled")}
        </Text>
        <Text c="dimmed" size="sm" ta="center">
          {workspaceSharingDisabled
            ? t("Public sharing has been disabled at the workspace level.")
            : t("Public sharing has been disabled for this space.")}
        </Text>
      </Stack>
    );
  }

  if (isRestricted) {
    return (
      <Stack align="center" py="md">
        <IconLock size={20} stroke={1.5} />
        <Text fw={500} size="sm" ta="center">
          {t("Restricted page")}
        </Text>
        <Text c="dimmed" size="sm" ta="center">
          {t("Restricted pages cannot be shared publicly.")}
        </Text>
      </Stack>
    );
  }

  if (isDescendantShared) {
    return (
      <Stack gap="sm">
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
          <Group gap="4" wrap="nowrap">
            {getPageIcon(share.sharedPage.icon)}
            <Text fw={500} fz="sm" lineClamp={1}>
              {share.sharedPage.title || t("untitled")}
            </Text>
          </Group>
        </Anchor>
        {shareLink}
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
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
          checked={isPagePublic}
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
          <Group gap="xl" justify="space-between" wrap="nowrap">
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
    </Stack>
  );
}
