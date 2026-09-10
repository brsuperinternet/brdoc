import { Button, Group, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconLock, IconServer } from "@tabler/icons-react";
import { useState } from "react";
import { OpenIdIcon } from "@/components/icons/openid-icon.tsx";
import SsoProviderModal from "@/ee/security/components/sso-provider-modal.tsx";
import { SSO_PROVIDER } from "@/ee/security/contants.ts";
import { useCreateSsoProviderMutation } from "@/ee/security/queries/security-query.ts";
import { IAuthProvider } from "@/ee/security/types/security.types.ts";

export default function CreateSsoProvider() {
  const [opened, { open, close }] = useDisclosure(false);
  const [provider, setProvider] = useState<IAuthProvider | null>(null);

  const createSsoProviderMutation = useCreateSsoProviderMutation();

  const handleCreateSAML = async () => {
    try {
      const newProvider = await createSsoProviderMutation.mutateAsync({
        name: "SAML",
        type: SSO_PROVIDER.SAML,
      });
      setProvider(newProvider);
      open();
    } catch (error) {
      console.error("Failed to create SAML provider", error);
    }
  };

  const handleCreateOIDC = async () => {
    try {
      const newProvider = await createSsoProviderMutation.mutateAsync({
        name: "OIDC",
        type: SSO_PROVIDER.OIDC,
      });
      setProvider(newProvider);
      open();
    } catch (error) {
      console.error("Failed to create OIDC provider", error);
    }
  };

  const handleCreateLDAP = async () => {
    try {
      const newProvider = await createSsoProviderMutation.mutateAsync({
        name: "LDAP",
        type: SSO_PROVIDER.LDAP,
      });
      setProvider(newProvider);
      open();
    } catch (error) {
      console.error("Failed to create LDAP provider", error);
    }
  };

  return (
    <>
      <SsoProviderModal onClose={close} opened={opened} provider={provider} />

      <Group justify="flex-end">
        <Menu
          position="bottom"
          transitionProps={{ transition: "pop-top-right" }}
          width={220}
          withinPortal
        >
          <Menu.Target>
            <Button pr={12} rightSection={<IconChevronDown size={16} />}>
              Create SSO
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconLock size={16} />}
              onClick={handleCreateSAML}
            >
              SAML
            </Menu.Item>

            <Menu.Item
              leftSection={<OpenIdIcon size={16} />}
              onClick={handleCreateOIDC}
            >
              OpenID (OIDC)
            </Menu.Item>

            <Menu.Item
              leftSection={<IconServer size={16} />}
              onClick={handleCreateLDAP}
            >
              LDAP / Active Directory
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </>
  );
}
