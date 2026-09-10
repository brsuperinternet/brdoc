import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useDeleteSiemDestinationMutation } from "@/ee/siem/queries/siem-query";
import { ISiemDestination } from "@/ee/siem/types/siem.types";

interface DeleteDestinationModalProps {
  destination: ISiemDestination | null;
  onClose: () => void;
  opened: boolean;
}

export function DeleteDestinationModal({
  opened,
  onClose,
  destination,
}: DeleteDestinationModalProps) {
  const { t } = useTranslation();
  const deleteMutation = useDeleteSiemDestinationMutation();

  const handleDelete = async () => {
    if (!destination) {
      return;
    }
    await deleteMutation.mutateAsync({ destinationId: destination.id });
    onClose();
  };

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      size="md"
      title={t("Delete destination")}
    >
      <Stack gap="md">
        <Text>
          {t("Are you sure you want to delete the destination")}{" "}
          <strong>{destination?.name}</strong>?
        </Text>
        <Group justify="flex-end" mt="md">
          <Button onClick={onClose} variant="default">
            {t("Cancel")}
          </Button>
          <Button
            color="red"
            loading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {t("Delete")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
