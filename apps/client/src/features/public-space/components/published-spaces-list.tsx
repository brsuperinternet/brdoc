import { ActionIcon, Anchor, Group, Menu, Table, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconCopy,
  IconDots,
  IconExternalLink,
  IconWorld,
  IconWorldOff,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Paginate from "@/components/common/paginate.tsx";
import rowClasses from "@/components/ui/clickable-table-row.module.css";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import { buildPublicSpaceUrl } from "@/features/page/page.utils.ts";
import {
  usePublishedSpacesQuery,
  usePublishSpaceMutation,
} from "@/features/public-space/queries/public-space-query.ts";
import { IPublishedSpaceItem } from "@/features/public-space/types/public-space.types.ts";
import { useClipboard } from "@/hooks/use-clipboard";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";
import { getAppUrl, getSpaceUrl } from "@/lib/config.ts";
import { formatLocalized, useDateFnsLocale } from "@/lib/date-locale.ts";

export default function PublishedSpacesList() {
  const { t } = useTranslation();
  const { cursor, goNext, goPrev } = useCursorPaginate();
  const { data, isLoading } = usePublishedSpacesQuery({ cursor });
  const locale = useDateFnsLocale();

  if (!isLoading && data?.items.length === 0) {
    return <EmptyState icon={IconWorld} title={t("No published spaces")} />;
  }

  return (
    <>
      <Table.ScrollContainer minWidth={500}>
        <Table verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("Space")}</Table.Th>
              <Table.Th>{t("Published by")}</Table.Th>
              <Table.Th>{t("Published at")}</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {data?.items.map((item: IPublishedSpaceItem) => (
              <Table.Tr className={rowClasses.row} key={item.id}>
                <Table.Td>
                  <Anchor
                    className={rowClasses.link}
                    href={buildPublicSpaceUrl({ spaceSlug: item.space.slug })}
                    size="sm"
                    style={{
                      color: "var(--mantine-color-text)",
                      cursor: "pointer",
                    }}
                    target="_blank"
                    underline="never"
                  >
                    <Group gap="8" wrap="nowrap">
                      <CustomAvatar
                        avatarUrl={item.space.logo}
                        color="initials"
                        name={item.space.name}
                        radius="sm"
                        size={20}
                        type={AvatarIconType.SPACE_ICON}
                        variant="filled"
                      />
                      <Text fw={500} fz="sm" lineClamp={1}>
                        {item.space.name}
                      </Text>
                    </Group>
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Group gap="4" wrap="nowrap">
                    <CustomAvatar
                      avatarUrl={item.creator?.avatarUrl}
                      name={item.creator?.name}
                      size="sm"
                    />
                    <Text fz="sm" lineClamp={1}>
                      {item.creator?.name}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text fz="sm" style={{ whiteSpace: "nowrap" }}>
                    {formatLocalized(
                      item.createdAt,
                      "MMM dd, yyyy",
                      "PP",
                      locale
                    )}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <PublishedSpaceActionMenu item={item} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {data?.items.length > 0 && (
        <Paginate
          hasNextPage={data?.meta?.hasNextPage}
          hasPrevPage={data?.meta?.hasPrevPage}
          onNext={() => goNext(data?.meta?.nextCursor)}
          onPrev={goPrev}
        />
      )}
    </>
  );
}

function PublishedSpaceActionMenu({ item }: { item: IPublishedSpaceItem }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const clipboard = useClipboard();
  const publishMutation = usePublishSpaceMutation();

  const publicPath = buildPublicSpaceUrl({ spaceSlug: item.space.slug });

  const copyLink = () => {
    clipboard.copy(`${getAppUrl()}${publicPath}`);
    notifications.show({ message: t("Link copied") });
  };

  const onUnpublish = async () => {
    try {
      await publishMutation.mutateAsync({
        enabled: false,
        spaceId: item.spaceId,
      });
    } catch {
      // error handled by mutation
    }
  };

  const openUnpublishModal = () =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t("This space will no longer be publicly accessible. Are you sure?")}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Unpublish") },
      onConfirm: onUnpublish,
      title: t("Unpublish space"),
    });

  return (
    <Menu
      arrowPosition="center"
      offset={20}
      position="bottom-end"
      shadow="xl"
      width={200}
      withArrow
    >
      <Menu.Target>
        <ActionIcon
          aria-label={t("More options for {{name}}", {
            name: item.space.name,
          })}
          c="gray"
          variant="subtle"
        >
          <IconDots size={20} stroke={2} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item leftSection={<IconCopy size={16} />} onClick={copyLink}>
          {t("Copy link")}
        </Menu.Item>

        <Menu.Item
          leftSection={<IconExternalLink size={16} />}
          onClick={() => navigate(getSpaceUrl(item.space.slug))}
        >
          {t("Open space")}
        </Menu.Item>

        <Menu.Item
          c="red"
          disabled={item.space?.userRole !== "admin"}
          leftSection={<IconWorldOff size={16} />}
          onClick={openUnpublishModal}
        >
          {t("Unpublish")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
