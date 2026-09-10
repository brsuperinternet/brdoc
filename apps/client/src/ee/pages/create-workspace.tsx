import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { SetupWorkspaceForm } from "@/features/auth/components/setup-workspace-form.tsx";

export default function CreateWorkspace() {
  return (
    <>
      <DocumentTitle title="Create Workspace" />
      <SetupWorkspaceForm />
    </>
  );
}
