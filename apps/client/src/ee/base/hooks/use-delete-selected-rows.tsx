import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRowSelection } from "@/ee/base/hooks/use-row-selection";
import { useDeleteRowsMutation } from "@/ee/base/queries/base-row-query";

const BATCH_SIZE = 500;

export function useDeleteSelectedRows(pageId: string) {
  const { t } = useTranslation();
  const { selectedIds, clear } = useRowSelection(pageId);
  const mutation = useDeleteRowsMutation();

  const runDelete = useCallback(
    async (ids: string[]) => {
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        chunks.push(ids.slice(i, i + BATCH_SIZE));
      }
      try {
        for (const chunk of chunks) {
          await mutation.mutateAsync({ pageId, rowIds: chunk });
        }
        notifications.show({
          message: t("{{count}} rows deleted", { count: ids.length }),
        });
        clear();
      } catch {
        // mutation onError already shows notification
      }
    },
    [pageId, mutation, clear, t]
  );

  const deleteSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      return;
    }
    modals.openConfirmModal({
      centered: true,
      children: <Text size="sm">{t("This action cannot be undone.")}</Text>,
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Delete") },
      onConfirm: () => void runDelete(ids),
      title: t("Delete {{count}} rows?", { count: ids.length }),
    });
  }, [selectedIds, runDelete, t]);

  return { deleteSelected, isPending: mutation.isPending };
}
