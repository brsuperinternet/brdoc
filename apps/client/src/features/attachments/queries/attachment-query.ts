import {
  InfiniteData,
  keepPreviousData,
  UseInfiniteQueryResult,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { getPageAttachments } from "@/features/attachments/services/attachment-service.ts";
import { IPageAttachment } from "@/features/attachments/types/attachment.types.ts";
import { IPagination } from "@/lib/types.ts";

export function usePageAttachmentsQuery(
  pageId: string,
  search?: string
): UseInfiniteQueryResult<InfiniteData<IPagination<IPageAttachment>, unknown>> {
  return useInfiniteQuery({
    enabled: !!pageId,
    gcTime: 0,
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    initialPageParam: undefined,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      getPageAttachments(pageId, { cursor: pageParam, query: search }),
    queryKey: ["page-attachments", pageId, search],
  });
}
