import { Button, Group, Modal, Select, Stack, TextInput } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";
import useUserRole from "@/hooks/use-user-role";
import { useCreateTemplateMutation } from "../queries/template-query";

type CreateTemplateModalProps = {
  opened: boolean;
  onClose: () => void;
};

export default function CreateTemplateModal({
  opened,
  onClose,
}: CreateTemplateModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin: isWorkspaceAdmin } = useUserRole();
  const createMutation = useCreateTemplateMutation();
  const { data: spaces } = useGetSpacesQuery({ limit: 100 });

  const [title, setTitle] = useState("");
  const [spaceId, setSpaceId] = useState<string | null>(null);

  const scopeOptions = [
    ...(isWorkspaceAdmin
      ? [{ group: t("Workspace"), items: [{ label: t("Global"), value: "" }] }]
      : []),
    ...(spaces?.items?.length
      ? [
          {
            group: t("Spaces"),
            items: spaces.items.map((s) => ({ label: s.name, value: s.id })),
          },
        ]
      : []),
  ];

  const handleCreate = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        spaceId: spaceId || undefined,
        title: title.trim(),
      });

      handleClose();
      navigate(`/templates/${result.id}`);
    } catch {
      // error notification handled by mutation's onError
    }
  };

  const handleClose = () => {
    setTitle("");
    setSpaceId(null);
    onClose();
  };

  return (
    <Modal
      centered
      onClose={handleClose}
      opened={opened}
      title={t("New template")}
    >
      <Stack gap="md">
        <TextInput
          data-autofocus
          label={t("Title")}
          onChange={(e) => setTitle(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              title.trim() &&
              !createMutation.isPending
            ) {
              handleCreate();
            }
          }}
          placeholder={t("Untitled")}
          value={title}
        />

        <Select
          data={scopeOptions}
          description={t("Choose which space this template belongs to")}
          label={t("Scope")}
          onChange={(val) => setSpaceId(val || null)}
          placeholder={t("Select scope")}
          searchable
          value={spaceId || ""}
        />

        <Group justify="flex-end" mt="sm">
          <Button onClick={handleClose} variant="default">
            {t("Cancel")}
          </Button>
          <Button
            disabled={!title.trim()}
            loading={createMutation.isPending}
            onClick={handleCreate}
          >
            {t("Create")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
