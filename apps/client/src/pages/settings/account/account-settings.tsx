import { Divider } from "@mantine/core";
import { useTranslation } from "react-i18next";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import SessionList from "@/features/session/components/session-list";
import AccountAvatar from "@/features/user/components/account-avatar";
import AccountNameForm from "@/features/user/components/account-name-form";
import ChangeEmail from "@/features/user/components/change-email";
import ChangePassword from "@/features/user/components/change-password";

export default function AccountSettings() {
  const { t } = useTranslation();

  return (
    <>
      <DocumentTitle title={t("My Profile")} />
      <SettingsTitle title={t("My Profile")} />

      <AccountAvatar />

      <AccountNameForm />

      <Divider my="lg" />

      <ChangeEmail />

      <Divider my="lg" />

      <ChangePassword />

      <Divider my="lg" />

      <Divider my="lg" />

      <SessionList />
    </>
  );
}
