import {
  InfiniteData,
  UseInfiniteQueryResult,
  UseQueryResult,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import {
  getPageHistoryById,
  getPageHistoryList,
} from "@/features/page-history/services/page-history-service";
import { IPageHistory } from "@/features/page-history/types/page.types";
import { IPagination } from "@/lib/types.ts";
import { queryClient } from "@/main";

const HISTORY_STALE_TIME = 60 * 60 * 1000;

export function prefetchPageHistory(historyId: string) {
  return queryClient.prefetchQuery({
    queryFn: () => getPageHistoryById(historyId),
    queryKey: ["page-history", historyId],
    staleTime: HISTORY_STALE_TIME,
  });
}

export function fetchPageHistory(historyId: string): Promise<IPageHistory> {
  return queryClient.fetchQuery({
    queryFn: () => getPageHistoryById(historyId),
    queryKey: ["page-history", historyId],
    staleTime: HISTORY_STALE_TIME,
  });
}

export function usePageHistoryListQuery(
  pageId: string
): UseInfiniteQueryResult<InfiniteData<IPagination<IPageHistory>, unknown>> {
  return useInfiniteQuery({
    enabled: !!pageId,
    gcTime: 0,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    initialPageParam: undefined,
    queryFn: ({ pageParam }) => getPageHistoryList(pageId, pageParam),
    queryKey: ["page-history-list", pageId],
  });
}

export function usePageHistoryQuery(
  historyId: string
): UseQueryResult<IPageHistory, Error> {
  return useQuery({
    enabled: !!historyId,
    queryFn: () => getPageHistoryById(historyId),
    queryKey: ["page-history", historyId],
    staleTime: HISTORY_STALE_TIME,
  });
}
