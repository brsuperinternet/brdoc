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

export default function EnforceSso() {
  const { t } = useTranslation();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Enforce SSO")}</Text>
        <Text c="dimmed" size="sm">
          {t(
            "Once enforced, members will not be able to login with email and password."
          )}
        </Text>
      </div>

      <EnforceSsoToggle />
    </Group>
  );
}

interface EnforceSsoToggleProps {
  label?: string;
  size?: MantineSize;
}
export function EnforceSsoToggle({ size, label }: EnforceSsoToggleProps) {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(workspace?.enforceSso);
  const hasAccess = useHasFeature(Feature.SSO_CUSTOM);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({ enforceSso: value });
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
        aria-label={t("Toggle sso enforcement")}
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
