import { Modal, ScrollArea, Text } from "@mantine/core";
import { IconTable } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import ReadonlyPageEditor from "@/features/editor/readonly-page-editor.tsx";

interface Props {
  isBase?: boolean;
  onClose: () => void;
  opened: boolean;
  pageContent: any;
  pageTitle: string;
}

export default function TrashPageContentModal({
  opened,
  onClose,
  pageTitle,
  pageContent,
  isBase,
}: Props) {
  const { t } = useTranslation();
  const title = pageTitle || t("Untitled");

  return (
    <Modal.Root
      aria-label={t("Preview")}
      onClose={onClose}
      opened={opened}
      size={1200}
    >
      <Modal.Overlay />
      <Modal.Content style={{ overflow: "hidden" }}>
        <Modal.Header>
          <Modal.Title>
            <Text fw={500} size="md">
              {t("Preview")}
            </Text>
          </Modal.Title>
          <Modal.CloseButton aria-label={t("Close")} />
        </Modal.Header>
        <Modal.Body p={0}>
          <ScrollArea h="650" scrollbarSize={5} w="100%">
            {isBase ? (
              <EmptyState
                description={t("Restore this base to view its contents.")}
                icon={IconTable}
                title={t("Base preview unavailable")}
              />
            ) : (
              <ReadonlyPageEditor content={pageContent} title={title} />
            )}
          </ScrollArea>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
