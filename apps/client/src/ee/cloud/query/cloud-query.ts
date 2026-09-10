import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { getJoinedWorkspaces } from "@/ee/cloud/service/cloud-service.ts";
import { IWorkspace } from "@/features/workspace/types/workspace.types.ts";

export function useJoinedWorkspacesQuery(): UseQueryResult<
  Partial<IWorkspace[]>,
  Error
> {
  return useQuery({
    queryFn: () => getJoinedWorkspaces(),
    queryKey: ["joined-workspaces"],
  });
}
