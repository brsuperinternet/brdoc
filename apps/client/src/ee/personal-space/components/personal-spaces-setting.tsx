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

export default function PersonalSpacesSetting() {
  const { t } = useTranslation();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Text size="md">{t("Allow personal spaces")}</Text>
        <Text c="dimmed" size="sm">
          {t("Members can create their own personal space.")}
        </Text>
      </div>

      <PersonalSpacesToggle />
    </Group>
  );
}

function PersonalSpacesToggle() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(
    workspace?.settings?.spaces?.allowPersonal === true
  );
  const hasPersonalSpaces = useHasFeature(Feature.PERSONAL_SPACES);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({
        allowPersonalSpaces: value,
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
    <Tooltip
      disabled={hasPersonalSpaces}
      label={upgradeLabel}
      refProp="rootRef"
    >
      <Switch
        aria-label={t("Toggle allow personal spaces")}
        checked={checked}
        disabled={!hasPersonalSpaces}
        onChange={handleChange}
      />
    </Tooltip>
  );
}
