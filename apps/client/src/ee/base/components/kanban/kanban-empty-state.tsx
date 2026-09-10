import { Button, Select, Stack, Text } from "@mantine/core";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useCreatePropertyMutation } from "@/ee/base/queries/base-property-query";
import { useUpdateViewMutation } from "@/ee/base/queries/base-view-query";
import { IBase, IBaseView } from "@/ee/base/types/base.types";
import { generateBaseChoiceId } from "@/ee/base/utils/generate-base-id";

type KanbanEmptyStateProps = {
  base: IBase;
  view: IBaseView;
  pageId: string;
  editable: boolean;
};

export function KanbanEmptyState({
  base,
  view,
  pageId,
  editable,
}: KanbanEmptyStateProps) {
  const { t } = useTranslation();
  const updateView = useUpdateViewMutation();
  const createProperty = useCreatePropertyMutation();

  const groupableProperties = base.properties.filter(
    (p) => p.type === "select" || p.type === "status"
  );

  const selectData = groupableProperties.map((p) => ({
    label: p.name,
    value: p.id,
  }));

  const handleSelect = useCallback(
    (value: string | null) => {
      if (!value) {
        return;
      }
      updateView.mutate({
        config: { groupByPropertyId: value },
        pageId,
        viewId: view.id,
      });
    },
    [updateView, view.id, pageId]
  );

  const handleCreateStatus = useCallback(() => {
    const todoId = generateBaseChoiceId();
    const inProgressId = generateBaseChoiceId();
    const completeId = generateBaseChoiceId();
    createProperty.mutate(
      {
        name: t("Status"),
        pageId,
        type: "status",
        typeOptions: {
          choiceOrder: [todoId, inProgressId, completeId],
          choices: [
            {
              category: "todo",
              color: "gray",
              id: todoId,
              name: t("Not started"),
            },
            {
              category: "inProgress",
              color: "blue",
              id: inProgressId,
              name: t("In progress"),
            },
            {
              category: "complete",
              color: "green",
              id: completeId,
              name: t("Done"),
            },
          ],
        },
      },
      {
        onSuccess: (newProperty) => {
          updateView.mutate({
            config: { groupByPropertyId: newProperty.id },
            pageId,
            viewId: view.id,
          });
        },
      }
    );
  }, [createProperty, updateView, view.id, pageId, t]);

  if (!editable) {
    return (
      <Stack align="center" gap="md" style={{ flex: 1, paddingTop: "15vh" }}>
        <Text fw={500}>{t("This board has no grouping property yet.")}</Text>
      </Stack>
    );
  }

  return (
    <Stack align="center" gap="md" style={{ flex: 1, paddingTop: "15vh" }}>
      <Text fw={500}>
        {t("Group this board by a select or status property.")}
      </Text>
      {groupableProperties.length > 0 ? (
        <Select
          data={selectData}
          onChange={handleSelect}
          placeholder={t("Choose a property")}
          value={view.config?.groupByPropertyId ?? null}
          w={240}
        />
      ) : (
        <Button
          loading={createProperty.isPending}
          onClick={handleCreateStatus}
          size="sm"
          variant="light"
        >
          {t("Create a status property")}
        </Button>
      )}
    </Stack>
  );
}
