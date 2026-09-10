import {
  Button,
  Card,
  Center,
  Container,
  Group,
  Select,
  SimpleGrid,
  Skeleton,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { IconPlus } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import CreateTemplateModal from "@/ee/template/components/create-template-modal";
import TemplateCard from "@/ee/template/components/template-card";
import TemplatePreviewModal from "@/ee/template/components/template-preview-modal";
import UseTemplateModal from "@/ee/template/components/use-template-modal";
import {
  useDeleteTemplateMutation,
  useGetTemplatesQuery,
} from "@/ee/template/queries/template-query";
import { ITemplate } from "@/ee/template/types/template.types";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom";
import useUserRole from "@/hooks/use-user-role";

export default function TemplateList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin: isWorkspaceAdmin } = useUserRole();
  const workspace = useAtomValue(workspaceAtom);
  const canCreateTemplate =
    isWorkspaceAdmin ||
    workspace?.settings?.templates?.allowMemberTemplates === true;
  const [spaceFilter, setSpaceFilter] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ITemplate | null>(
    null
  );
  const [useModalOpened, { open: openUseModal, close: closeUseModal }] =
    useDisclosure(false);
  const [previewOpened, { open: openPreview, close: closePreview }] =
    useDisclosure(false);
  const [
    createModalOpened,
    { open: openCreateModal, close: closeCreateModal },
  ] = useDisclosure(false);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useGetTemplatesQuery({
      spaceId: spaceFilter || undefined,
    });

  const templates = data?.pages.flatMap((p) => p.items) ?? [];

  const { data: spaces } = useGetSpacesQuery({ limit: 100 });
  const deleteTemplateMutation = useDeleteTemplateMutation();

  const spaceOptions = [
    { label: t("All templates"), value: "" },
    ...(spaces?.items?.map((s) => ({ label: s.name, value: s.id })) || []),
  ];

  const spaceNameMap = new Map(spaces?.items?.map((s) => [s.id, s.name]) || []);

  const handlePreview = (template: ITemplate) => {
    setSelectedTemplate(template);
    openPreview();
  };

  const handleUse = (template: ITemplate) => {
    setSelectedTemplate(template);
    closePreview();
    openUseModal();
  };

  const handleEdit = (template: ITemplate) => {
    navigate(`/templates/${template.id}`);
  };

  const handleDelete = (template: ITemplate) => {
    modals.openConfirmModal({
      centered: true,
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Delete") },
      onConfirm: () => deleteTemplateMutation.mutate(template.id),
      title: t("Are you sure you want to delete this template?"),
    });
  };

  return (
    <>
      <DocumentTitle title={t("Templates")} />

      <Container pt="xl" size="900">
        <Group justify="space-between" mb="xl">
          <Title order={3}>{t("Templates")}</Title>
          {canCreateTemplate && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={openCreateModal}
            >
              {t("New template")}
            </Button>
          )}
        </Group>

        <Group mb="lg">
          <Select
            clearable={false}
            comboboxProps={{ width: "target" }}
            data={spaceOptions}
            onChange={(val) => setSpaceFilter(val || null)}
            placeholder={t("Filter by space")}
            searchable
            size="sm"
            value={spaceFilter || ""}
            w={220}
          />
        </Group>

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 3, xs: 2 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                padding="lg"
                radius="md"
                style={{ boxShadow: "rgba(0, 0, 0, 0.07) 0px 2px 45px 4px" }}
              >
                <Group align="flex-start" justify="space-between" mb="md">
                  <Skeleton height={36} radius="md" width={36} />
                </Group>
                <Skeleton height={14} mb={8} width="70%" />
                <Skeleton height={10} mb="sm" width="50%" />
                <Group
                  justify="space-between"
                  pt="sm"
                  style={{
                    borderTop: "1px solid var(--mantine-color-gray-2)",
                    marginTop: "auto",
                  }}
                >
                  <Skeleton height={20} radius="xl" width={60} />
                  <Group gap={6}>
                    <Skeleton circle height={18} />
                    <Skeleton height={10} width={80} />
                  </Group>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        ) : templates.length ? (
          <>
            <SimpleGrid cols={{ base: 1, sm: 3, xs: 2 }}>
              {templates.map((template) => (
                <TemplateCard
                  canManage={isWorkspaceAdmin}
                  key={template.id}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onPreview={handlePreview}
                  onUse={handleUse}
                  spaceName={
                    template.spaceId
                      ? spaceNameMap.get(template.spaceId)
                      : undefined
                  }
                  template={template}
                />
              ))}
            </SimpleGrid>
            {hasNextPage && (
              <Button
                fullWidth
                loading={isFetchingNextPage}
                mb="xl"
                mt="sm"
                onClick={() => fetchNextPage()}
                variant="subtle"
              >
                {t("Load more")}
              </Button>
            )}
          </>
        ) : (
          <Center py="xl">
            <Text c="dimmed">{t("No templates found")}</Text>
          </Center>
        )}
      </Container>

      <CreateTemplateModal
        onClose={closeCreateModal}
        opened={createModalOpened}
      />

      {selectedTemplate && (
        <>
          <TemplatePreviewModal
            onClose={closePreview}
            onEdit={
              isWorkspaceAdmin ? () => handleEdit(selectedTemplate) : undefined
            }
            onUse={() => handleUse(selectedTemplate)}
            opened={previewOpened}
            templateId={selectedTemplate.id}
          />
          <UseTemplateModal
            onClose={closeUseModal}
            opened={useModalOpened}
            template={selectedTemplate}
          />
        </>
      )}
    </>
  );
}
