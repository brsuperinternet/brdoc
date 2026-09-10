import { Group, MantineSize, Switch, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features.ts";
import { useHasFeature } from "@/ee/hooks/use-feature.ts";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

export default function EnforceMfa() {
  const { t } = useTranslation();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Enforce two-factor authentication")}</Text>
        <Text c="dimmed" size="sm">
          {t(
            "Once enforced, all members must enable two-factor authentication to access the workspace."
          )}
        </Text>
      </div>

      <EnforceMfaToggle />
    </Group>
  );
}

interface EnforceMfaToggleProps {
  label?: string;
  size?: MantineSize;
}
export function EnforceMfaToggle({ size, label }: EnforceMfaToggleProps) {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(workspace?.enforceMfa);
  const hasAccess = useHasFeature(Feature.MFA);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({ enforceMfa: value });
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
    <Tooltip disabled={hasAccess} label={upgradeLabel} refProp="rootRef">
      <Switch
        aria-label={t("Toggle MFA enforcement")}
        defaultChecked={checked}
        disabled={!hasAccess}
        label={label}
        labelPosition="left"
        onChange={handleChange}
        size={size}
      />
    </Tooltip>
  );
}
