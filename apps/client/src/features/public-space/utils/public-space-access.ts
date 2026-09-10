import { IWorkspace } from "@/features/workspace/types/workspace.types.ts";
import { isBetaPublicSpaces } from "@/lib/config.ts";

export function isPublicSpacesAllowed(workspace?: IWorkspace): boolean {
  return (
    isBetaPublicSpaces() && workspace?.settings?.publicSpaces?.enabled === true
  );
}
