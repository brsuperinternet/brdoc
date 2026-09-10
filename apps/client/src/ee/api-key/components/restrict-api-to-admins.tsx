import { Switch, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveSettingsContent,
  ResponsiveSettingsControl,
  ResponsiveSettingsRow,
} from "@/components/ui/responsive-settings-row";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

export default function RestrictApiToAdmins() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(
    workspace?.settings?.api?.restrictToAdmins === true
  );
  const hasAccess = useHasFeature(Feature.API_KEYS);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({
        restrictApiToAdmins: value,
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

  return (
    <ResponsiveSettingsRow>
      <ResponsiveSettingsContent>
        <Text size="md">{t("Restrict API key creation to admins")}</Text>
        <Text c="dimmed" size="sm">
          {t(
            "Only admins and owners can create new API keys. Existing member keys will continue to work."
          )}
        </Text>
      </ResponsiveSettingsContent>

      <ResponsiveSettingsControl>
        <Tooltip disabled={hasAccess} label={upgradeLabel} refProp="rootRef">
          <Switch
            aria-label={t("Toggle restrict API keys to admins")}
            checked={checked}
            disabled={!hasAccess}
            onChange={handleChange}
          />
        </Tooltip>
      </ResponsiveSettingsControl>
    </ResponsiveSettingsRow>
  );
}
