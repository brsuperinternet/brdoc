import { Alert, Collapse, Stack, Tabs } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import EnableAiSearch from "@/ee/ai/components/enable-ai-search.tsx";
import EnableGenerativeAi from "@/ee/ai/components/enable-generative-ai.tsx";
import McpSettings from "@/ee/ai/components/mcp-settings.tsx";
import AiChatReadOnly from "@/ee/ai-chat/components/ai-chat-read-only.tsx";
import AiChatWorkspaceKnowledgeOnly from "@/ee/ai-chat/components/ai-chat-workspace-knowledge-only.tsx";
import EnableAiChat from "@/ee/ai-chat/components/enable-ai-chat.tsx";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import useUserRole from "@/hooks/use-user-role.tsx";
import { isCloud } from "@/lib/config.ts";

export default function AiSettings() {
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();
  const hasAccess = useHasFeature(Feature.AI);
  const upgradeLabel = useUpgradeLabel();
  const workspace = useAtomValue(workspaceAtom);
  const aiChatEnabled = workspace?.settings?.ai?.chat === true;
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = location.pathname.endsWith("/mcp") ? "mcp" : "ai";

  if (!isAdmin) {
    return null;
  }

  const handleTabChange = (value: string | null) => {
    if (value === "mcp") {
      navigate("/settings/ai/mcp");
    } else {
      navigate("/settings/ai");
    }
  };

  return (
    <>
      <DocumentTitle title="AI settings" />
      <SettingsTitle title={t("AI settings")} />

      <Tabs color="dark" onChange={handleTabChange} value={activeTab}>
        <Tabs.List>
          <Tabs.Tab fw={500} value="ai">
            {t("AI")}
          </Tabs.Tab>
          <Tabs.Tab fw={500} value="mcp">
            {t("MCP")}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel pt="md" value="ai">
          {!hasAccess && (
            <Alert
              color="blue"
              icon={<IconInfoCircle />}
              mb="lg"
              title={upgradeLabel}
            >
              {t(
                "AI is available in the Docmost paid editions. Contact sales@docmost.com."
              )}
            </Alert>
          )}

          <Stack gap="md">
            {!isCloud() && <EnableAiSearch />}
            <EnableGenerativeAi />
            <EnableAiChat />
            <Collapse expanded={aiChatEnabled}>
              <Stack
                gap="md"
                ml="xs"
                pl="md"
                style={{
                  borderLeft:
                    "2px solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4))",
                }}
              >
                <AiChatReadOnly />
                <AiChatWorkspaceKnowledgeOnly />
              </Stack>
            </Collapse>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel pt="md" value="mcp">
          <McpSettings />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
