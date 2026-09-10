import { Anchor, Button, Divider, Group, Space, Text } from "@mantine/core";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Paginate from "@/components/common/paginate";
import SettingsTitle from "@/components/settings/settings-title";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { IApiKey } from "@/ee/api-key";
import { ApiKeyCreatedModal } from "@/ee/api-key/components/api-key-created-modal";
import { ApiKeyTable } from "@/ee/api-key/components/api-key-table";
import { CreateApiKeyModal } from "@/ee/api-key/components/create-api-key-modal";
import RestrictApiToAdmins from "@/ee/api-key/components/restrict-api-to-admins";
import { RevokeApiKeyModal } from "@/ee/api-key/components/revoke-api-key-modal";
import { UpdateApiKeyModal } from "@/ee/api-key/components/update-api-key-modal";
import { useGetApiKeysQuery } from "@/ee/api-key/queries/api-key-query.ts";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";
import useUserRole from "@/hooks/use-user-role.tsx";

export default function WorkspaceApiKeys() {
  const { t } = useTranslation();
  const { cursor, goNext, goPrev } = useCursorPaginate();
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<IApiKey | null>(null);
  const [updateModalOpened, setUpdateModalOpened] = useState(false);
  const [revokeModalOpened, setRevokeModalOpened] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<IApiKey | null>(null);
  const { data, isLoading } = useGetApiKeysQuery({ adminView: true, cursor });
  const { isAdmin } = useUserRole();

  if (!isAdmin) {
    return null;
  }

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

  return (
    <>
      <DocumentTitle title={t("API management")} />

      <SettingsTitle title={t("API management")} />

      <Text c="dimmed" mb="md" size="sm">
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
          i18nKey="Manage API keys for all users in the workspace. View the <anchor>API documentation</anchor> for usage details."
        />
      </Text>

      <RestrictApiToAdmins />
      <Divider my="lg" />

      <Group justify="flex-end" mb="md">
        <Button onClick={() => setCreateModalOpened(true)}>
          {t("Create API Key")}
        </Button>
      </Group>

      <ApiKeyTable
        apiKeys={data?.items}
        isLoading={isLoading}
        onRevoke={handleRevoke}
        onUpdate={handleUpdate}
        showUserColumn
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
