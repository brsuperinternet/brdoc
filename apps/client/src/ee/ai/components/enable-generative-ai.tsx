import { Group, Switch, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

export default function EnableGenerativeAi() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(workspace?.settings?.ai?.generative);
  const hasAccess = useHasFeature(Feature.AI);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({ generativeAi: value });
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
        <Text size="md">{t("Generative AI (Ask AI)")}</Text>
        <Text c="dimmed" size="sm">
          {t(
            "Enable AI-powered content generation in the editor. Allows users to generate, improve, translate and transform text."
          )}
        </Text>
      </div>

      <Tooltip disabled={hasAccess} label={upgradeLabel} refProp="rootRef">
        <Switch
          defaultChecked={checked}
          disabled={!hasAccess}
          onChange={handleChange}
        />
      </Tooltip>
    </Group>
  );
}
