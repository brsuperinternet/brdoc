import { Group, Switch, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label.ts";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

export default function AllowMemberTemplates() {
  const { t } = useTranslation();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Allow members to create templates")}</Text>
        <Text c="dimmed" size="sm">
          {t(
            "Allow non-admin members to create and manage templates in their spaces."
          )}
        </Text>
      </div>

      <AllowMemberTemplatesToggle />
    </Group>
  );
}

function AllowMemberTemplatesToggle() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(
    workspace?.settings?.templates?.allowMemberTemplates === true
  );
  const hasTemplates = useHasFeature(Feature.TEMPLATES);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({
        allowMemberTemplates: value,
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
    <Tooltip disabled={hasTemplates} label={upgradeLabel} refProp="rootRef">
      <Switch
        aria-label={t("Toggle allow members to create templates")}
        checked={checked}
        disabled={!hasTemplates}
        onChange={handleChange}
      />
    </Tooltip>
  );
}
