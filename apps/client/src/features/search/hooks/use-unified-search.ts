import { UseQueryResult, useQuery } from "@tanstack/react-query";

import { searchPage } from "@/features/search/services/search-service";
import {
  IAttachmentSearch,
  IPageSearch,
  IPageSearchParams,
} from "@/features/search/types/search.types";

export type UnifiedSearchResult = IPageSearch | IAttachmentSearch;

export interface UseUnifiedSearchParams extends IPageSearchParams {
  contentType?: string;
}

export function useUnifiedSearch(
  params: UseUnifiedSearchParams,
  enabled = true
): UseQueryResult<UnifiedSearchResult[], Error> {
  return useQuery({
    enabled:
      (!!params.query ||
        (params.labelIds?.length ?? 0) > 0 ||
        !!params.creatorId) &&
      enabled,
    // keep previous results only within the same search type; page results
    // rendered as attachments (or vice versa) crash on missing fields
    placeholderData: (previousData, previousQuery) => {
      if (!(params.query || params.labelIds?.length || params.creatorId)) {
        return;
      }
      if (previousQuery && previousQuery.queryKey[1] !== "page") {
        return;
      }
      return previousData;
    },
    queryFn: async () => {
      // Remove contentType from backend params since it's only used for frontend routing
      const { contentType, ...backendParams } = params;

      return await searchPage(backendParams);
    },
    queryKey: ["unified-search", params],
  });
}
