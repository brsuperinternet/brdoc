import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useTranslation } from "react-i18next";

type UseDeleteModalProps = {
  onConfirm: () => void;
  isPermanent?: boolean;
};

export function useDeletePageModal() {
  const { t } = useTranslation();
  const openDeleteModal = ({
    onConfirm,
    isPermanent = false,
  }: UseDeleteModalProps) => {
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {isPermanent
            ? t(
                "Are you sure you want to delete this page? This will delete its children and page history. This action is irreversible."
              )
            : t("Pages in trash will be permanently deleted after 30 days.")}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: {
        cancel: t("Cancel"),
        confirm: isPermanent ? t("Delete") : t("Move to trash"),
      },
      onConfirm,
      title: isPermanent
        ? t("Are you sure you want to delete this page?")
        : t("Move this page to trash?"),
    });
  };

  return { openDeleteModal } as const;
}
