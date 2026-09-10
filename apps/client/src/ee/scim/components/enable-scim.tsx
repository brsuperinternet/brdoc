import { Group, Switch, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features.ts";
import { useHasFeature } from "@/ee/hooks/use-feature.ts";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

export default function EnableScim() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(workspace?.isScimEnabled ?? false);
  const hasAccess = useHasFeature(Feature.SCIM);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({ isScimEnabled: value });
      setChecked(value);
      setWorkspace(updatedWorkspace);
    } catch (err) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message,
      });
    }
  };

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Enable SCIM")}</Text>
        <Text c="dimmed" size="sm">
          {t(
            "Automatically provision users and groups from your identity provider via SCIM."
          )}
        </Text>
      </div>

      <Tooltip disabled={hasAccess} label={upgradeLabel} refProp="rootRef">
        <Switch
          aria-label={t("Toggle SCIM provisioning")}
          defaultChecked={checked}
          disabled={!hasAccess}
          labelPosition="left"
          onChange={handleChange}
        />
      </Tooltip>
    </Group>
  );
}
