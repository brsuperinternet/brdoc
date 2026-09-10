import { Group, Switch, Text, Tooltip } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

export default function DisablePublicSharing() {
  const { t } = useTranslation();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Disable public sharing")}</Text>
        <Text c="dimmed" size="sm">
          {t("Prevent members from sharing pages publicly.")}
        </Text>
      </div>

      <DisablePublicSharingToggle />
    </Group>
  );
}

function DisablePublicSharingToggle() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(
    workspace?.settings?.sharing?.disabled === true
  );
  const hasSharingControls = useHasFeature(Feature.SHARING_CONTROLS);
  const upgradeLabel = useUpgradeLabel();

  const applyChange = async (value: boolean) => {
    try {
      const updatedWorkspace = await updateWorkspace({
        disablePublicSharing: value,
      });
      setChecked(value);
      setWorkspace(updatedWorkspace);
    } catch (err) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message,
      });
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
                "Are you sure you want to disable public sharing? All existing shared links in this workspace will be deleted."
              )
            : t(
                "Are you sure you want to enable public sharing? Members will be able to share pages publicly."
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
    <Tooltip
      disabled={hasSharingControls}
      label={upgradeLabel}
      refProp="rootRef"
    >
      <Switch
        aria-label={t("Toggle public sharing")}
        checked={checked}
        disabled={!hasSharingControls}
        onChange={handleChange}
      />
    </Tooltip>
  );
}
