import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getBacklinks,
  getBacklinksCount,
} from "@/features/page-details/services/backlinks-service.ts";
import {
  BacklinkDirection,
  IBacklinkCount,
} from "@/features/page-details/types/backlink.types.ts";

const BACKLINKS_STALE_TIME = 30 * 1000;
const BACKLINKS_PAGE_LIMIT = 100;

export function useBacklinksCountQuery(pageId: string | undefined) {
  return useQuery<IBacklinkCount>({
    enabled: !!pageId,
    queryFn: () => getBacklinksCount(pageId as string),
    queryKey: ["backlinks-count", pageId],
    staleTime: BACKLINKS_STALE_TIME,
  });
}

export function useBacklinksQuery(
  pageId: string | undefined,
  direction: BacklinkDirection,
  enabled: boolean
) {
  return useInfiniteQuery({
    enabled: enabled && !!pageId,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage
        ? (lastPage.meta.nextCursor ?? undefined)
        : undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getBacklinks({
        cursor: pageParam,
        direction,
        limit: BACKLINKS_PAGE_LIMIT,
        pageId: pageId as string,
      }),
    queryKey: ["backlinks", pageId, direction],
    staleTime: BACKLINKS_STALE_TIME,
  });
}
