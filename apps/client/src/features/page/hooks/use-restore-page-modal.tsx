import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useTranslation } from "react-i18next";

type UseRestoreModalProps = {
  title?: string | null;
  onConfirm: () => void;
};

export function useRestorePageModal() {
  const { t } = useTranslation();
  const openRestoreModal = ({ title, onConfirm }: UseRestoreModalProps) => {
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t("Restore '{{title}}' and its sub-pages?", {
            title: title || t("Untitled"),
          })}
        </Text>
      ),
      confirmProps: { color: "blue" },
      labels: { cancel: t("Cancel"), confirm: t("Restore") },
      onConfirm,
      title: t("Restore page"),
    });
  };

  return { openRestoreModal } as const;
}
