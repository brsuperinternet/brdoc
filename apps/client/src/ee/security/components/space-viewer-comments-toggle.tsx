import { Group, Switch, Text, Tooltip } from "@mantine/core";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features.ts";
import { useHasFeature } from "@/ee/hooks/use-feature.ts";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label.ts";
import { useUpdateSpaceMutation } from "@/features/space/queries/space-query.ts";
import { ISpace } from "@/features/space/types/space.types.ts";

type SpaceViewerCommentsToggleProps = {
  space: ISpace;
};

export default function SpaceViewerCommentsToggle({
  space,
}: SpaceViewerCommentsToggleProps) {
  const { t } = useTranslation();
  const hasViewerComments = useHasFeature(Feature.VIEWER_COMMENTS);
  const upgradeLabel = useUpgradeLabel();
  const isDisabled = !hasViewerComments;
  const [checked, setChecked] = useState(
    space.settings?.comments?.allowViewerComments === true
  );
  const updateSpaceMutation = useUpdateSpaceMutation();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      await updateSpaceMutation.mutateAsync({
        allowViewerComments: value,
        spaceId: space.id,
      });
      setChecked(value);
    } catch {
      // error handled by mutation
    }
  };

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Allow viewers to comment")}</Text>
        <Text c="dimmed" size="sm">
          {t("Allow viewers to add comments on pages in this space.")}
        </Text>
      </div>
      <Tooltip disabled={!isDisabled} label={upgradeLabel} refProp="rootRef">
        <Switch
          aria-label={t("Toggle viewer comments")}
          checked={checked}
          disabled={isDisabled}
          onChange={handleChange}
          size={"xs"}
        />
      </Tooltip>
    </Group>
  );
}
