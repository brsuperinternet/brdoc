import { getGroups } from "@/features/group/services/group-service.ts";
import { getShares } from "@/features/share/services/share-service.ts";
import { getSpaces } from "@/features/space/services/space-service.ts";
import { getWorkspaceMembers } from "@/features/workspace/services/workspace-service.ts";
import { QueryParams } from "@/lib/types.ts";
import { queryClient } from "@/main.tsx";

export const prefetchWorkspaceMembers = () => {
  const params: QueryParams = { limit: 100, query: "" };
  queryClient.prefetchQuery({
    queryFn: () => getWorkspaceMembers(params),
    queryKey: ["workspaceMembers", params],
  });
};

export const prefetchSpaces = () => {
  queryClient.prefetchQuery({
    queryFn: () => getSpaces({}),
    queryKey: ["spaces", {}],
  });
};

export const prefetchGroups = () => {
  queryClient.prefetchQuery({
    queryFn: () => getGroups({}),
    queryKey: ["groups", {}],
  });
};

export const prefetchShares = () => {
  queryClient.prefetchQuery({
    queryFn: () => getShares({}),
    queryKey: ["share-list", {}],
  });
};
