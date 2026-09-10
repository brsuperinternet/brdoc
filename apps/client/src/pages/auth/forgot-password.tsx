import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export default function ForgotPassword() {
  return (
    <>
      <DocumentTitle title="Forgot Password" />
      <ForgotPasswordForm />
    </>
  );
}
