import {
  ActionIcon,
  Container,
  Group,
  Menu,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconDots, IconRestore, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { PageListIcon } from "@/components/common/page-list-icon";
import Paginate from "@/components/common/paginate.tsx";
import { UserInfo } from "@/components/common/user-info.tsx";
import { useRestorePageModal } from "@/features/page/hooks/use-restore-page-modal.tsx";
import {
  useDeletedPagesQuery,
  useDeletePageMutation,
  useRestorePageMutation,
} from "@/features/page/queries/page-query";
import { TrashBanner } from "@/features/page/trash/components/trash-banner.tsx";
import TrashPageContentModal from "@/features/page/trash/components/trash-page-content-modal";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";
import { formattedDate } from "@/lib/time";

export default function Trash() {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const { cursor, goNext, goPrev } = useCursorPaginate();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);
  const { data: deletedPages, isLoading } = useDeletedPagesQuery(space?.id, {
    cursor,
    limit: 50,
  });
  const restorePageMutation = useRestorePageMutation();
  const deletePageMutation = useDeletePageMutation();
  const { openRestoreModal } = useRestorePageModal();

  const [selectedPage, setSelectedPage] = useState<{
    title: string;
    content: any;
    isBase?: boolean;
  } | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const handleRestorePage = async (pageId: string) => {
    await restorePageMutation.mutateAsync(pageId);
  };

  const handleDeletePage = async (pageId: string) => {
    await deletePageMutation.mutateAsync(pageId);
  };

  const openDeleteModal = (pageId: string, pageTitle: string) => {
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to permanently delete '{{title}}'? This action cannot be undone.",
            { title: pageTitle || "Untitled" }
          )}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Delete") },
      onConfirm: () => handleDeletePage(pageId),
      title: t("Are you sure you want to delete this page?"),
    });
  };

  const hasPages = deletedPages && deletedPages.items.length > 0;

  const handlePageClick = (page: any) => {
    setSelectedPage({
      content: page.content,
      isBase: page.isBase,
      title: page.title,
    });
    setModalOpened(true);
  };

  return (
    <Container py="lg" size="lg">
      <Stack gap="md">
        <Group justify="space-between" mb="md">
          <Title order={2}>{t("Trash")}</Title>
        </Group>

        <TrashBanner />

        {isLoading || !deletedPages ? (
          <></>
        ) : hasPages ? (
          <Table.ScrollContainer minWidth={500}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("Page")}</Table.Th>
                  <Table.Th style={{ whiteSpace: "nowrap" }}>
                    {t("Deleted by")}
                  </Table.Th>
                  <Table.Th style={{ whiteSpace: "nowrap" }}>
                    {t("Deleted at")}
                  </Table.Th>
                  <Table.Th aria-label={t("Action")} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {deletedPages.items.map((page) => (
                  <Table.Tr key={page.id}>
                    <Table.Td>
                      <Group
                        onClick={() => handlePageClick(page)}
                        style={{ cursor: "pointer" }}
                        wrap="nowrap"
                      >
                        <PageListIcon icon={page.icon} isBase={page.isBase} />
                        <div>
                          <Text fw={500} lineClamp={1} size="sm">
                            {page.title || t("Untitled")}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <UserInfo size="sm" user={page.deletedBy} />
                    </Table.Td>
                    <Table.Td>
                      <Text
                        c="dimmed"
                        fw={500}
                        size="xs"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        {formattedDate(page.deletedAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu>
                        <Menu.Target>
                          <ActionIcon
                            aria-label={t("Page actions")}
                            color="gray"
                            variant="subtle"
                          >
                            <IconDots size={20} stroke={1.5} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconRestore size={16} />}
                            onClick={() =>
                              openRestoreModal({
                                onConfirm: () => handleRestorePage(page.id),
                                title: page.title,
                              })
                            }
                          >
                            {t("Restore")}
                          </Menu.Item>
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={16} />}
                            onClick={() => openDeleteModal(page.id, page.title)}
                          >
                            {t("Delete")}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Text c="dimmed" py="xl" ta="center">
            {t("No pages in trash")}
          </Text>
        )}

        {deletedPages && deletedPages.items.length > 0 && (
          <Paginate
            hasNextPage={deletedPages.meta?.hasNextPage}
            hasPrevPage={deletedPages.meta?.hasPrevPage}
            onNext={() => goNext(deletedPages.meta?.nextCursor)}
            onPrev={goPrev}
          />
        )}
      </Stack>

      {selectedPage && (
        <TrashPageContentModal
          isBase={selectedPage.isBase}
          onClose={() => setModalOpened(false)}
          opened={modalOpened}
          pageContent={selectedPage.content}
          pageTitle={selectedPage.title}
        />
      )}
    </Container>
  );
}
