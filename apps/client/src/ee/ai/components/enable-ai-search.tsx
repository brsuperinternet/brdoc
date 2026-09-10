import { Group, MantineSize, Switch, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

export default function EnableAiSearch() {
  const { t } = useTranslation();

  return (
    <>
      <Group gap="xl" justify="space-between" wrap="nowrap">
        <div>
          <Text size="md">{t("AI-powered search (AI Answers)")}</Text>
          <Text c="dimmed" size="sm">
            {t(
              "AI search uses vector embeddings to provide semantic search capabilities across your workspace content."
            )}
          </Text>
        </div>

        <AiSearchToggle />
      </Group>
    </>
  );
}

interface AiSearchToggleProps {
  label?: string;
  size?: MantineSize;
}
export function AiSearchToggle({ size, label }: AiSearchToggleProps) {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(workspace?.settings?.ai?.search);
  const hasAccess = useHasFeature(Feature.AI);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({ aiSearch: value });
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
        aria-label={t("Toggle AI search")}
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
