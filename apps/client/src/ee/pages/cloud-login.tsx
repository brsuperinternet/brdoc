import { useTranslation } from "react-i18next";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { CloudLoginForm } from "@/ee/components/cloud-login-form.tsx";

export default function CloudLogin() {
  const { t } = useTranslation();

  return (
    <>
      <DocumentTitle title={t("Login")} />

      <CloudLoginForm />
    </>
  );
}
