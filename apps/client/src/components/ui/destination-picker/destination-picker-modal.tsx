import { Button, Divider, Group, Modal } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { DestinationPicker } from "./destination-picker";
import {
  DestinationPickerModalProps,
  DestinationSelection,
} from "./destination-picker.types";

export function DestinationPickerModal({
  opened,
  onClose,
  title,
  actionLabel,
  onSelect,
  loading,
  excludePageId,
  pageLimit,
  initialSpaceId,
  searchSpacesOnly,
}: DestinationPickerModalProps) {
  const { t } = useTranslation();
  const [selection, setSelection] = useState<DestinationSelection | null>(null);

  useEffect(() => {
    if (!opened) {
      setSelection(null);
    }
  }, [opened]);

  return (
    <Modal.Root
      onClick={(e) => e.stopPropagation()}
      onClose={onClose}
      opened={opened}
      padding="lg"
      size={550}
      yOffset="10vh"
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header py={0}>
          <Modal.Title fw={500}>{title}</Modal.Title>
          <Modal.CloseButton aria-label={t("Close")} />
        </Modal.Header>
        <Modal.Body>
          <DestinationPicker
            excludePageId={excludePageId}
            initialSpaceId={initialSpaceId}
            onSelectionChange={setSelection}
            pageLimit={pageLimit}
            searchSpacesOnly={searchSpacesOnly}
          />

          <Divider my="md" />

          <Group justify="flex-end">
            <Button onClick={onClose} variant="default">
              {t("Close")}
            </Button>
            <Button
              disabled={!selection}
              loading={loading}
              onClick={() => selection && onSelect(selection)}
            >
              {actionLabel}
            </Button>
          </Group>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
