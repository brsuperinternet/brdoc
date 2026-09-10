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

export default function EnableAiChat() {
  const { t } = useTranslation();

  return (
    <Group gap="xl" justify="space-between" wrap="nowrap">
      <div>
        <Group align="center" gap="xs">
          <Text size="md">{t("AI Chat")}</Text>
          <Badge color="gray" radius="sm" size="sm" variant="light">
            {t("Beta")}
          </Badge>
        </Group>
        <Text c="dimmed" size="sm">
          {t(
            "Enable AI Chat to allow users to have multi-turn conversations with AI about your workspace content."
          )}
        </Text>
      </div>

      <AiChatToggle />
    </Group>
  );
}

function AiChatToggle() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(workspace?.settings?.ai?.chat);
  const hasAccess = useHasFeature(Feature.AI);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({ aiChat: value } as any);
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
        aria-label={t("Toggle AI Chat")}
        defaultChecked={checked}
        disabled={!hasAccess}
        onChange={handleChange}
      />
    </Tooltip>
  );
}
