import {
  Button,
  Center,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Text,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import ReadonlyTemplateEditor from "@/ee/template/components/readonly-template-editor";
import { useGetTemplateByIdQuery } from "@/ee/template/queries/template-query";

type TemplatePreviewModalProps = {
  templateId: string;
  opened: boolean;
  onClose: () => void;
  onUse: () => void;
  onEdit?: () => void;
  useLoading?: boolean;
};

export default function TemplatePreviewModal({
  templateId,
  opened,
  onClose,
  onUse,
  onEdit,
  useLoading,
}: TemplatePreviewModalProps) {
  const { t } = useTranslation();
  const { data: template, isLoading } = useGetTemplateByIdQuery(templateId);

  const title = template?.title || t("Untitled");

  return (
    <Modal.Root
      aria-label={title}
      onClose={onClose}
      opened={opened}
      size={1200}
    >
      <Modal.Overlay />
      <Modal.Content style={{ overflow: "hidden" }}>
        <Modal.Header>
          <Modal.Title>
            <Group gap="xs">
              {template?.icon && <Text size="lg">{template.icon}</Text>}
              <Text fw={500} size="md">
                {title}
              </Text>
            </Group>
          </Modal.Title>
          <Group gap="sm">
            <Button
              disabled={useLoading}
              loading={useLoading}
              onClick={onUse}
              size="xs"
            >
              {t("Use template")}
            </Button>
            {onEdit && (
              <Button onClick={onEdit} size="xs" variant="default">
                {t("Edit")}
              </Button>
            )}
            <Modal.CloseButton aria-label={t("Close")} />
          </Group>
        </Modal.Header>
        <Modal.Body p={0}>
          {isLoading ? (
            <Center py="xl">
              <Loader size="sm" />
            </Center>
          ) : (
            <ScrollArea h="80vh" scrollbarSize={5} w="100%">
              {template && <ReadonlyTemplateEditor template={template} />}
            </ScrollArea>
          )}
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
