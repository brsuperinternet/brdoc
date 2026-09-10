import { Divider, Popover, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import clsx from "clsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LabelChip } from "@/features/label/components/label-chip.tsx";
import { LabelPicker } from "@/features/label/components/label-picker.tsx";
import classes from "@/features/label/label.module.css";
import {
  useAddLabelsMutation,
  usePageLabelsQuery,
  useRemoveLabelMutation,
} from "@/features/label/queries/label-query.ts";

type LabelsSectionProps = {
  pageId: string;
  canEdit: boolean;
};

export function LabelsSection({ pageId, canEdit }: LabelsSectionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data } = usePageLabelsQuery(pageId);
  const addMutation = useAddLabelsMutation(pageId);
  const removeMutation = useRemoveLabelMutation(pageId);

  const labels = data?.items ?? [];

  if (!canEdit && labels.length === 0) {
    return null;
  }

  const handleAdd = (name: string) => {
    addMutation.mutate({ names: [name], pageId });
  };

  const handleRemove = (labelId: string) => {
    removeMutation.mutate({ labelId, pageId });
  };

  return (
    <>
      <Divider />
      <Stack gap="xs">
        <Text c="dimmed" fw={500} size="xs">
          {t("Labels")}
        </Text>
        <div className={classes.labelsWrap}>
          {labels.map((label) => (
            <LabelChip
              asLink
              key={label.id}
              label={label}
              onRemove={canEdit ? () => handleRemove(label.id) : undefined}
            />
          ))}
          {canEdit && (
            <Popover
              offset={6}
              onChange={setOpen}
              opened={open}
              position="bottom-end"
              shadow="lg"
              withinPortal
            >
              <Popover.Target>
                <button
                  className={clsx(classes.addBtn, open && classes.addBtnOpen)}
                  onClick={() => setOpen((v) => !v)}
                  type="button"
                >
                  <IconPlus size={12} stroke={2} />
                  <span>{labels.length === 0 ? t("Add label") : t("Add")}</span>
                </button>
              </Popover.Target>
              <Popover.Dropdown className={classes.popover} p={0}>
                <LabelPicker
                  applied={labels}
                  enabled={open}
                  onAdd={(name) => handleAdd(name)}
                  onClose={() => setOpen(false)}
                />
              </Popover.Dropdown>
            </Popover>
          )}
        </div>
      </Stack>
    </>
  );
}
