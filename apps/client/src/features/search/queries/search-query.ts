import {
  keepPreviousData,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import {
  searchAttachments,
  searchPage,
  searchPublicSpace,
  searchShare,
  searchSuggestions,
} from "@/features/search/services/search-service";
import {
  IAttachmentSearch,
  IPageSearch,
  IPageSearchParams,
  ISuggestionResult,
  SearchSuggestionParams,
} from "@/features/search/types/search.types";

export function usePageSearchQuery(
  params: IPageSearchParams
): UseQueryResult<IPageSearch[], Error> {
  return useQuery({
    enabled: !!params.query,
    queryFn: () => searchPage(params),
    queryKey: ["page-search", params],
  });
}

export function useSearchSuggestionsQuery(
  params: SearchSuggestionParams & { preload?: boolean }
): UseQueryResult<ISuggestionResult, Error> {
  const { preload, ...queryParams } = params;
  return useQuery({
    enabled: preload || !!params.query,
    placeholderData: keepPreviousData,
    queryFn: () => searchSuggestions(queryParams),
    queryKey: ["search-suggestion", params.query],
    staleTime: 60 * 1000, // 1min
  });
}

export function useShareSearchQuery(
  params: IPageSearchParams
): UseQueryResult<IPageSearch[], Error> {
  return useQuery({
    enabled: !!params.query,
    queryFn: () => searchShare(params),
    queryKey: ["share-search", params],
  });
}

export function useAttachmentSearchQuery(
  params: IPageSearchParams
): UseQueryResult<IAttachmentSearch[], Error> {
  return useQuery({
    enabled: !!params.query,
    queryFn: () => searchAttachments(params),
    queryKey: ["attachment-search", params],
  });
}

export function usePublicSpaceSearchQuery(
  params: IPageSearchParams & { spaceSlug: string }
): UseQueryResult<IPageSearch[], Error> {
  return useQuery({
    enabled: !!params.query && !!params.spaceSlug,
    queryFn: () => searchPublicSpace(params),
    queryKey: ["public-space-search", params],
  });
}
