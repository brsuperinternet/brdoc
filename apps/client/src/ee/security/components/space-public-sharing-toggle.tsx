import { Group, Switch, Text, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features.ts";
import { useHasFeature } from "@/ee/hooks/use-feature.ts";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label.ts";
import { useUpdateSpaceMutation } from "@/features/space/queries/space-query.ts";
import { ISpace } from "@/features/space/types/space.types.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";

type SpacePublicSharingToggleProps = {
  space: ISpace;
};

export default function SpacePublicSharingToggle({
  space,
}: SpacePublicSharingToggleProps) {
  const { t } = useTranslation();
  const [workspace] = useAtom(workspaceAtom);
  const workspaceDisabled = workspace?.settings?.sharing?.disabled === true;
  const hasSharingControls = useHasFeature(Feature.SHARING_CONTROLS);
  const upgradeLabel = useUpgradeLabel();
  const isDisabled = !hasSharingControls || workspaceDisabled;
  const [checked, setChecked] = useState(
    space.settings?.sharing?.disabled === true
  );
  const updateSpaceMutation = useUpdateSpaceMutation();

  const applyChange = async (value: boolean) => {
    try {
      await updateSpaceMutation.mutateAsync({
        disablePublicSharing: value,
        spaceId: space.id,
      });
      setChecked(value);
    } catch {
      // error handled by mutation
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;

    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {value
            ? t(
                "Are you sure you want to disable public sharing? All existing shared links in this space will be deleted."
              )
            : t(
                "Are you sure you want to enable public sharing for this space?"
              )}
        </Text>
      ),
      confirmProps: value ? { color: "red" } : {},
      labels: { cancel: t("Cancel"), confirm: t("Confirm") },
      onConfirm: () => applyChange(value),
      title: value ? t("Disable public sharing") : t("Enable public sharing"),
    });
  };

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Disable public sharing")}</Text>
        <Text c="dimmed" size="sm">
          {workspaceDisabled
            ? t("Public sharing is disabled at the workspace level")
            : t("Prevent pages in this space from being shared publicly.")}
        </Text>
      </div>
      <Tooltip
        disabled={!isDisabled}
        label={
          hasSharingControls
            ? t("Public sharing is disabled at the workspace level")
            : upgradeLabel
        }
        refProp="rootRef"
      >
        <Switch
          aria-label={t("Toggle space public sharing")}
          checked={checked}
          disabled={isDisabled}
          onChange={handleChange}
          size={"xs"}
        />
      </Tooltip>
    </Group>
  );
}
