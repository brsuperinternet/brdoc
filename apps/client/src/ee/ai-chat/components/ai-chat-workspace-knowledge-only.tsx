import { Badge, Group, Switch, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";

export default function AiChatWorkspaceKnowledgeOnly() {
  const { t } = useTranslation();
  const hasAccess = useHasFeature(Feature.AI_CONTROLS);

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Group align="center" gap="xs">
          <Text size="md">{t("Workspace knowledge only")}</Text>
          {!hasAccess && (
            <Badge radius="sm" size="sm" variant="light">
              {t("Enterprise")}
            </Badge>
          )}
        </Group>
        <Text c="dimmed" size="sm">
          {t(
            "Restrict AI Chat to answering from your workspace pages and uploaded files only. It will not use outside knowledge."
          )}
        </Text>
      </div>

      <AiChatWorkspaceKnowledgeOnlyToggle />
    </Group>
  );
}

function AiChatWorkspaceKnowledgeOnlyToggle() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(
    workspace?.settings?.ai?.chatWorkspaceKnowledgeOnly
  );
  const hasAccess = useHasFeature(Feature.AI_CONTROLS);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({
        aiChatWorkspaceKnowledgeOnly: value,
      });
      setChecked(value);
      setWorkspace(updatedWorkspace);
    } catch (err: any) {
      notifications.show({
        color: "red",
        message: err?.response?.data?.message,
      });
    }
  };

  return (
    <Tooltip disabled={hasAccess} label={upgradeLabel} refProp="rootRef">
      <Switch
        aria-label={t("Toggle workspace knowledge only")}
        defaultChecked={checked}
        disabled={!hasAccess}
        onChange={handleChange}
      />
    </Tooltip>
  );
}
