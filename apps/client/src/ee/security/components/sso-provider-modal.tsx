import { Modal } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { SsoGoogleForm } from "@/ee/security/components/sso-google-form.tsx";
import { SsoLDAPForm } from "@/ee/security/components/sso-ldap-form.tsx";
import { SsoOIDCForm } from "@/ee/security/components/sso-oidc-form.tsx";
import { SsoSamlForm } from "@/ee/security/components/sso-saml-form.tsx";
import { SSO_PROVIDER } from "@/ee/security/contants.ts";
import { IAuthProvider } from "@/ee/security/types/security.types.ts";

interface SsoModalProps {
  onClose: () => void;
  opened: boolean;
  provider: IAuthProvider | null;
}

export default function SsoProviderModal({
  opened,
  onClose,
  provider,
}: SsoModalProps) {
  const { t } = useTranslation();

  if (!provider) {
    return null;
  }

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      title={t("{{ssoProviderType}} configuration", {
        ssoProviderType: provider.type.toUpperCase(),
      })}
    >
      {provider.type === SSO_PROVIDER.SAML && (
        <SsoSamlForm onClose={onClose} provider={provider} />
      )}

      {provider.type === SSO_PROVIDER.OIDC && (
        <SsoOIDCForm onClose={onClose} provider={provider} />
      )}

      {provider.type === SSO_PROVIDER.GOOGLE && (
        <SsoGoogleForm onClose={onClose} provider={provider} />
      )}

      {provider.type === SSO_PROVIDER.LDAP && (
        <SsoLDAPForm onClose={onClose} provider={provider} />
      )}
    </Modal>
  );
}
