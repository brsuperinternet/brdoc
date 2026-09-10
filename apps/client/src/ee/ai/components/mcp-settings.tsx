import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Group,
  List,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconCopy, IconInfoCircle } from "@tabler/icons-react";
import { useAtom } from "jotai";
import React, { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { CopyButton } from "@/components/common/copy-button.tsx";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { updateWorkspace } from "@/features/workspace/services/workspace-service.ts";
import { getAppUrl } from "@/lib/config.ts";

export default function McpSettings() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(workspace?.settings?.ai?.mcp);
  const hasAccess = useHasFeature(Feature.MCP);
  const upgradeLabel = useUpgradeLabel();

  const mcpUrl = `${getAppUrl()}/mcp`;

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({ mcpEnabled: value });
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
    <Stack gap="lg">
      {!hasAccess && (
        <Alert color="blue" icon={<IconInfoCircle />} title={upgradeLabel}>
          {t(
            "MCP is only available in the Docmost enterprise edition. Contact sales@docmost.com."
          )}
        </Alert>
      )}

      <Group gap="xl" justify="space-between" wrap="nowrap">
        <div>
          <Text size="md">{t("Model Context Protocol (MCP)")}</Text>
          <Text c="dimmed" size="sm">
            {t(
              "Enable the MCP server to allow AI assistants and tools to interact with your workspace content."
            )}{" "}
            <Trans
              components={{
                anchor: (
                  <Anchor
                    href="https://docmost.com/docs/user-guide/mcp"
                    size="sm"
                    target="_blank"
                  />
                ),
              }}
              i18nKey="View the <anchor>MCP documentation</anchor>."
            />
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

      {checked && (
        <div>
          <Text fw={500} mb={4} size="sm">
            {t("MCP Server URL")}
          </Text>
          <Group gap="xs">
            <TextInput readOnly style={{ flex: 1 }} value={mcpUrl} />
            <CopyButton timeout={2000} value={mcpUrl}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? t("Copied") : t("Copy")}
                  position="right"
                  withArrow
                >
                  <ActionIcon
                    color={copied ? "teal" : "gray"}
                    onClick={copy}
                    variant="subtle"
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          <Text c="dimmed" mt="xs" size="sm">
            {t("Connect AI assistants with your Docmost account via OAuth.")}
          </Text>

          <McpEnforceOauthSetting />

          <div>
            <Text fw={500} mb={4} mt="md" size="sm">
              {t("Supported tools")}
            </Text>
            <List size="sm" spacing={2}>
              <List.Item>
                <Text c="dimmed" size="sm" span>
                  search_pages, get_page, create_page, update_page
                </Text>
              </List.Item>
              <List.Item>
                <Text c="dimmed" size="sm" span>
                  list_pages, list_child_pages, duplicate_page
                </Text>
              </List.Item>
              <List.Item>
                <Text c="dimmed" size="sm" span>
                  copy_page_to_space, move_page, move_page_to_space
                </Text>
              </List.Item>
              <List.Item>
                <Text c="dimmed" size="sm" span>
                  get_space, list_spaces, create_space, update_space
                </Text>
              </List.Item>
              <List.Item>
                <Text c="dimmed" size="sm" span>
                  get_comments, create_comment, update_comment
                </Text>
              </List.Item>
              <List.Item>
                <Text c="dimmed" size="sm" span>
                  search_attachments, list_workspace_members, get_current_user
                </Text>
              </List.Item>
            </List>
          </div>
        </div>
      )}
    </Stack>
  );
}

function McpEnforceOauthSetting() {
  const { t } = useTranslation();
  const [workspace, setWorkspace] = useAtom(workspaceAtom);
  const [checked, setChecked] = useState(
    workspace?.settings?.ai?.enforceMcpOauth
  );
  const hasAccess = useHasFeature(Feature.MCP_CONTROLS);
  const upgradeLabel = useUpgradeLabel();

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.checked;
    try {
      const updatedWorkspace = await updateWorkspace({
        enforceMcpOauth: value,
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
    <Group gap="xl" justify="space-between" mt="md" wrap="nowrap">
      <div>
        <Group align="center" gap="xs">
          <Text fw={500} size="sm">
            {t("Enforce OAuth")}
          </Text>
          {!hasAccess && (
            <Badge radius="sm" size="sm" variant="light">
              {t("Enterprise")}
            </Badge>
          )}
        </Group>
        <Text c="dimmed" size="sm">
          {t(
            "AI assistants must connect with a Docmost account via OAuth. API keys cannot be used with the MCP server."
          )}
        </Text>
      </div>

      <Tooltip disabled={hasAccess} label={upgradeLabel} refProp="rootRef">
        <Switch
          aria-label={t("Toggle enforce OAuth for MCP")}
          defaultChecked={checked}
          disabled={!hasAccess}
          onChange={handleChange}
        />
      </Tooltip>
    </Group>
  );
}
