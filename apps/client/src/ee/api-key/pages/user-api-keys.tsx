import { Alert, Anchor, Button, Group, Space, Tabs, Text } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import Paginate from "@/components/common/paginate";
import SettingsTitle from "@/components/settings/settings-title";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { IApiKey } from "@/ee/api-key";
import { ApiKeyCreatedModal } from "@/ee/api-key/components/api-key-created-modal";
import { ApiKeyTable } from "@/ee/api-key/components/api-key-table";
import { CreateApiKeyModal } from "@/ee/api-key/components/create-api-key-modal";
import { RevokeApiKeyModal } from "@/ee/api-key/components/revoke-api-key-modal";
import { UpdateApiKeyModal } from "@/ee/api-key/components/update-api-key-modal";
import { useGetApiKeysQuery } from "@/ee/api-key/queries/api-key-query.ts";
import { AuthorizedAppsPanel } from "@/ee/oauth/components/authorized-apps-panel.tsx";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";
import useUserRole from "@/hooks/use-user-role.tsx";
import { getAppUrl } from "@/lib/config";

export default function UserApiKeys() {
  const { t } = useTranslation();
  const { cursor, goNext, goPrev } = useCursorPaginate();
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<IApiKey | null>(null);
  const [updateModalOpened, setUpdateModalOpened] = useState(false);
  const [revokeModalOpened, setRevokeModalOpened] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<IApiKey | null>(null);
  const { data, isLoading } = useGetApiKeysQuery({ cursor });
  const [workspace] = useAtom(workspaceAtom);
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.endsWith("/authorized-apps")
    ? "authorized-apps"
    : "api-keys";
  const mcpEnabled = workspace?.settings?.ai?.mcp === true;
  const restrictToAdmins = workspace?.settings?.api?.restrictToAdmins === true;
  const canCreate = !restrictToAdmins || isAdmin;

  const handleCreateSuccess = (response: IApiKey) => {
    setCreatedApiKey(response);
  };

  const handleUpdate = (apiKey: IApiKey) => {
    setSelectedApiKey(apiKey);
    setUpdateModalOpened(true);
  };

  const handleRevoke = (apiKey: IApiKey) => {
    setSelectedApiKey(apiKey);
    setRevokeModalOpened(true);
  };

  const handleTabChange = (value: string | null) => {
    navigate(
      value === "authorized-apps"
        ? "/settings/account/api-keys/authorized-apps"
        : "/settings/account/api-keys"
    );
  };

  return (
    <>
      <DocumentTitle
        title={
          activeTab === "authorized-apps" ? t("Authorized apps") : t("API keys")
        }
      />

      <SettingsTitle title={t("API keys")} />

      {mcpEnabled && (
        <Alert
          color="blue"
          icon={<IconInfoCircle />}
          mb="md"
          p="sm"
          variant="light"
        >
          <Text size="sm">
            {t(
              "Your workspace has MCP enabled. Connect AI assistants with your Docmost account via OAuth."
            )}{" "}
            <Anchor
              href="https://docmost.com/docs/user-guide/mcp"
              size="sm"
              target="_blank"
            >
              {t("Learn more")}
            </Anchor>
          </Text>
          <Text mt={4} size="sm">
            {t("MCP server URL:")}{" "}
            <Text ff="monospace" fw={500} size="sm" span>
              {`${getAppUrl()}/mcp`}
            </Text>
          </Text>
        </Alert>
      )}

      <Tabs color="dark" onChange={handleTabChange} value={activeTab}>
        <Tabs.List>
          <Tabs.Tab fw={500} value="api-keys">
            {t("API keys")}
          </Tabs.Tab>
          <Tabs.Tab fw={500} value="authorized-apps">
            {t("Authorized apps")}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel pt="md" value="api-keys">
          <Group align="center" justify="space-between" mb="md">
            <Text c="dimmed" size="sm">
              <Trans
                components={{
                  anchor: (
                    <Anchor
                      href="https://docmost.com/api-docs"
                      size="sm"
                      target="_blank"
                    />
                  ),
                }}
                i18nKey="View the <anchor>API documentation</anchor> for usage details."
              />
            </Text>

            {canCreate && (
              <Button
                onClick={() => setCreateModalOpened(true)}
                style={{ flexShrink: 0 }}
              >
                {t("Create API Key")}
              </Button>
            )}
          </Group>

          {!canCreate && restrictToAdmins && (
            <Alert
              color="yellow"
              icon={<IconInfoCircle />}
              mb="md"
              p="sm"
              variant="light"
            >
              <Text size="sm">
                {t(
                  "API key creation is restricted to admins by your workspace administrator."
                )}
              </Text>
            </Alert>
          )}

          <ApiKeyTable
            apiKeys={data?.items || []}
            isLoading={isLoading}
            onRevoke={handleRevoke}
            onUpdate={handleUpdate}
          />

          <Space h="md" />

          {data?.items.length > 0 && (
            <Paginate
              hasNextPage={data?.meta?.hasNextPage}
              hasPrevPage={data?.meta?.hasPrevPage}
              onNext={() => goNext(data?.meta?.nextCursor)}
              onPrev={goPrev}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel pt="md" value="authorized-apps">
          <AuthorizedAppsPanel />
        </Tabs.Panel>
      </Tabs>

      <CreateApiKeyModal
        onClose={() => setCreateModalOpened(false)}
        onSuccess={handleCreateSuccess}
        opened={createModalOpened}
      />

      <ApiKeyCreatedModal
        apiKey={createdApiKey}
        onClose={() => setCreatedApiKey(null)}
        opened={!!createdApiKey}
      />

      <UpdateApiKeyModal
        apiKey={selectedApiKey}
        onClose={() => {
          setUpdateModalOpened(false);
          setSelectedApiKey(null);
        }}
        opened={updateModalOpened}
      />

      <RevokeApiKeyModal
        apiKey={selectedApiKey}
        onClose={() => {
          setRevokeModalOpened(false);
          setSelectedApiKey(null);
        }}
        opened={revokeModalOpened}
      />
    </>
  );
}
