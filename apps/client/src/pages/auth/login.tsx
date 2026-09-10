import { useTranslation } from "react-i18next";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <>
      <DocumentTitle title={t("Login")} />
      <LoginForm />
    </>
  );
}
