import {
  Alert,
  Button,
  Card,
  Divider,
  Group,
  Space,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Paginate from "@/components/common/paginate";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { CreateScimTokenModal } from "@/ee/scim/components/create-scim-token-modal";
import EnableScim from "@/ee/scim/components/enable-scim";
import { RevokeScimTokenModal } from "@/ee/scim/components/revoke-scim-token-modal";
import { ScimTokenCreatedModal } from "@/ee/scim/components/scim-token-created-modal";
import { ScimTokenTable } from "@/ee/scim/components/scim-token-table";
import { ScimUrlPanel } from "@/ee/scim/components/scim-url-panel";
import { UpdateScimTokenModal } from "@/ee/scim/components/update-scim-token-modal";
import { useGetScimTokensQuery } from "@/ee/scim/queries/scim-token-query";
import { IScimToken } from "@/ee/scim/types/scim-token.types";
import AllowedDomains from "@/ee/security/components/allowed-domains.tsx";
import CreateSsoProvider from "@/ee/security/components/create-sso-provider.tsx";
import DisablePublicSharing from "@/ee/security/components/disable-public-sharing.tsx";
import EnforceMfa from "@/ee/security/components/enforce-mfa.tsx";
import EnforceSso from "@/ee/security/components/enforce-sso.tsx";
import SsoProviderList from "@/ee/security/components/sso-provider-list.tsx";
import TrashRetention from "@/ee/security/components/trash-retention.tsx";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import { useCursorPaginate } from "@/hooks/use-cursor-paginate";
import useUserRole from "@/hooks/use-user-role.tsx";
import { isCloud } from "@/lib/config.ts";

const SCIM_TOKEN_LIMIT = 5;

export default function Security() {
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();
  const hasCustomSso = useHasFeature(Feature.SSO_CUSTOM);
  const hasScim = useHasFeature(Feature.SCIM);
  const [workspace] = useAtom(workspaceAtom);
  const isScimEnabled = workspace?.isScimEnabled ?? false;

  const { cursor, goNext, goPrev } = useCursorPaginate();
  const { data: scimData, isLoading: scimLoading } = useGetScimTokensQuery(
    hasScim && isScimEnabled ? { cursor } : undefined
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [createdToken, setCreatedToken] = useState<IScimToken | null>(null);
  const [updateTarget, setUpdateTarget] = useState<IScimToken | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<IScimToken | null>(null);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <DocumentTitle title="Security" />
      <SettingsTitle title={t("Security")} />

      <EnforceMfa />

      <Divider my="lg" />

      <DisablePublicSharing />
      <Divider my="lg" />

      <TrashRetention />
      <Divider my="lg" />

      <Title my="lg" order={4}>
        {t("Single sign-on (SSO)")}
      </Title>

      <EnforceSso />
      <Divider my="lg" />

      {(isCloud() || hasCustomSso) && (
        <>
          <AllowedDomains />
          <Divider my="lg" />
        </>
      )}

      {hasCustomSso && (
        <>
          <CreateSsoProvider />
          <Divider my="lg" size={0} />
        </>
      )}

      <SsoProviderList />

      {hasScim && (
        <>
          <Divider my="xl" />

          <Title my="lg" order={4}>
            {t("SCIM provisioning")}
          </Title>

          <Alert
            color="blue"
            icon={<IconInfoCircle size={16} />}
            mb="md"
            variant="light"
          >
            {t("SCIM takes precedence over SSO group sync while enabled.")}
          </Alert>

          <EnableScim />

          <Divider my="lg" />

          <ScimUrlPanel />

          {isScimEnabled && (
            <>
              <Divider my="lg" />

              <Group justify="space-between" mb="md">
                <Title order={5}>{t("SCIM tokens")}</Title>
                <Tooltip
                  disabled={(scimData?.items.length ?? 0) < SCIM_TOKEN_LIMIT}
                  label={t(
                    "You have reached the maximum of {{max}} SCIM tokens. Delete an existing token to create a new one.",
                    { max: SCIM_TOKEN_LIMIT }
                  )}
                >
                  <Button
                    disabled={(scimData?.items.length ?? 0) >= SCIM_TOKEN_LIMIT}
                    onClick={() => setCreateOpen(true)}
                  >
                    {t("Create {{credential}}", {
                      credential: t("SCIM token"),
                    })}
                  </Button>
                </Tooltip>
              </Group>

              <Card radius="sm" shadow="sm">
                <ScimTokenTable
                  isLoading={scimLoading}
                  onRevoke={setRevokeTarget}
                  onUpdate={setUpdateTarget}
                  tokens={scimData?.items}
                />
              </Card>

              <Space h="md" />

              {scimData?.items.length > 0 && (
                <Paginate
                  hasNextPage={scimData?.meta?.hasNextPage}
                  hasPrevPage={scimData?.meta?.hasPrevPage}
                  onNext={() => goNext(scimData?.meta?.nextCursor)}
                  onPrev={goPrev}
                />
              )}

              <CreateScimTokenModal
                onClose={() => setCreateOpen(false)}
                onSuccess={setCreatedToken}
                opened={createOpen}
              />

              <ScimTokenCreatedModal
                onClose={() => setCreatedToken(null)}
                opened={!!createdToken}
                scimToken={createdToken}
              />

              <UpdateScimTokenModal
                onClose={() => setUpdateTarget(null)}
                opened={!!updateTarget}
                scimToken={updateTarget}
              />

              <RevokeScimTokenModal
                onClose={() => setRevokeTarget(null)}
                opened={!!revokeTarget}
                scimToken={revokeTarget}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
