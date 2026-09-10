import { ActionIcon, Button, Group, Paper, Text, Tooltip } from "@mantine/core";
import { IconRestore, IconTrash } from "@tabler/icons-react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDeletePageModal } from "@/features/page/hooks/use-delete-page-modal.tsx";
import { useRestorePageModal } from "@/features/page/hooks/use-restore-page-modal.tsx";
import {
  useDeletePageMutation,
  usePageQuery,
  useRestorePageMutation,
} from "@/features/page/queries/page-query.ts";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability.ts";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { useTimeAgo } from "@/hooks/use-time-ago.tsx";
import { getSpaceUrl } from "@/lib/config.ts";

type DeletedPageBannerProps = {
  slugId: string;
};

export function DeletedPageBanner({ slugId }: DeletedPageBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: page } = usePageQuery({ pageId: slugId });
  const { data: space } = useGetSpaceBySlugQuery(page?.space?.slug);
  const spaceAbility = useSpaceAbility(space?.membership?.permissions);
  const deletedTimeAgo = useTimeAgo(page?.deletedAt);
  const restorePageMutation = useRestorePageMutation();
  const deletePageMutation = useDeletePageMutation();
  const { openRestoreModal } = useRestorePageModal();
  const { openDeleteModal } = useDeletePageModal();

  if (!page?.deletedAt) {
    return null;
  }

  const canRestore = spaceAbility.can(
    SpaceCaslAction.Edit,
    SpaceCaslSubject.Page
  );
  const canPermanentlyDelete = spaceAbility.can(
    SpaceCaslAction.Manage,
    SpaceCaslSubject.Settings
  );
  const actorName = page.deletedBy?.name ?? t("Someone");

  const handleRestore = () => {
    openRestoreModal({
      onConfirm: () => restorePageMutation.mutate(page.id),
      title: page.title,
    });
  };

  const handlePermanentDelete = () => {
    openDeleteModal({
      isPermanent: true,
      onConfirm: async () => {
        await deletePageMutation.mutateAsync(page.id);
        navigate(getSpaceUrl(page.space?.slug));
      },
    });
  };

  const hasAnyAction = canRestore || canPermanentlyDelete;

  return (
    <Paper bg="red.0" mb="md" px="md" py="xs" radius="sm">
      <Group gap="sm" justify="space-between" wrap="wrap">
        <Text size="sm" style={{ flex: 1, minWidth: 0 }}>
          <Trans
            components={{ b: <Text fw={600} inherit span /> }}
            i18nKey="<b>{{name}}</b> moved this page to Trash {{time}}."
            values={{ name: actorName, time: deletedTimeAgo }}
          />
        </Text>
        {hasAnyAction && (
          <>
            <Group gap="xs" visibleFrom="sm" wrap="nowrap">
              {canRestore && (
                <Button
                  color="red"
                  leftSection={<IconRestore size={16} />}
                  loading={restorePageMutation.isPending}
                  onClick={handleRestore}
                  size="xs"
                  variant="light"
                >
                  {t("Restore page")}
                </Button>
              )}
              {canPermanentlyDelete && (
                <Button
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  loading={deletePageMutation.isPending}
                  onClick={handlePermanentDelete}
                  size="xs"
                  variant="light"
                >
                  {t("Permanently delete")}
                </Button>
              )}
            </Group>
            <Group gap="xs" hiddenFrom="sm" wrap="nowrap">
              {canRestore && (
                <Tooltip label={t("Restore page")} withArrow>
                  <ActionIcon
                    aria-label={t("Restore page")}
                    loading={restorePageMutation.isPending}
                    onClick={handleRestore}
                    size="lg"
                    variant="default"
                  >
                    <IconRestore size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
              {canPermanentlyDelete && (
                <Tooltip label={t("Permanently delete")} withArrow>
                  <ActionIcon
                    aria-label={t("Permanently delete")}
                    color="red"
                    loading={deletePageMutation.isPending}
                    onClick={handlePermanentDelete}
                    size="lg"
                    variant="light"
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </>
        )}
      </Group>
    </Paper>
  );
}
