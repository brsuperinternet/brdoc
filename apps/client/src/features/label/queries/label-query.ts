import { notifications } from "@mantine/notifications";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  addLabelsToPage,
  findPagesByLabel,
  getLabelInfo,
  getPageLabels,
  getWorkspaceLabels,
  removeLabelFromPage,
} from "@/features/label/services/label-service.ts";
import {
  IAddLabels,
  ILabel,
  IRemoveLabel,
} from "@/features/label/types/label.types.ts";
import { IPagination } from "@/lib/types.ts";

const PAGE_LABELS_KEY = (pageId: string) => ["page-labels", pageId];
const WORKSPACE_LABELS_KEY = (query?: string) => [
  "workspace-labels",
  query ?? "",
];

export function usePageLabelsQuery(pageId: string | undefined) {
  return useQuery({
    enabled: !!pageId,
    queryFn: () => getPageLabels({ limit: 100, pageId: pageId as string }),
    queryKey: PAGE_LABELS_KEY(pageId ?? ""),
  });
}

export function useWorkspaceLabelsQuery(query: string, enabled: boolean) {
  return useQuery({
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () => getWorkspaceLabels({ limit: 50, query, type: "page" }),
    queryKey: WORKSPACE_LABELS_KEY(query),
    staleTime: 30 * 1000,
  });
}

export function useAddLabelsMutation(pageId: string | undefined) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<ILabel[], Error, IAddLabels>({
    mutationFn: (data) => addLabelsToPage(data),
    onError: (error: any) => {
      notifications.show({
        color: "red",
        message: error?.response?.data?.message ?? t("Failed to add label"),
      });
    },
    onSuccess: (added) => {
      queryClient.setQueryData<IPagination<ILabel>>(
        PAGE_LABELS_KEY(pageId ?? ""),
        (cache) => {
          if (!cache) {
            return cache;
          }
          const existing = new Set(cache.items.map((l) => l.id));
          const additions = added.filter((l) => !existing.has(l.id));
          if (additions.length === 0) {
            return cache;
          }
          return { ...cache, items: [...cache.items, ...additions] };
        }
      );

      queryClient.setQueriesData<IPagination<ILabel>>(
        { queryKey: ["workspace-labels"] },
        (cache) => {
          if (!cache) {
            return cache;
          }
          const existing = new Set(cache.items.map((l) => l.id));
          const additions = added.filter((l) => !existing.has(l.id));
          if (additions.length === 0) {
            return cache;
          }
          return {
            ...cache,
            items: [...cache.items, ...additions].sort((a, b) =>
              a.name.localeCompare(b.name)
            ),
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["label-pages"] });
      queryClient.invalidateQueries({ queryKey: ["label-info"] });
    },
  });
}

export function useRemoveLabelMutation(pageId: string | undefined) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, IRemoveLabel>({
    mutationFn: (data) => removeLabelFromPage(data),
    onError: () => {
      notifications.show({
        color: "red",
        message: t("Failed to remove label"),
      });
    },
    onSuccess: (_data, variables) => {
      const cache = queryClient.getQueryData<IPagination<ILabel>>(
        PAGE_LABELS_KEY(pageId ?? "")
      );
      if (cache) {
        queryClient.setQueryData<IPagination<ILabel>>(
          PAGE_LABELS_KEY(pageId ?? ""),
          {
            ...cache,
            items: cache.items.filter((l) => l.id !== variables.labelId),
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["workspace-labels"] });
      queryClient.invalidateQueries({ queryKey: ["label-pages"] });
      queryClient.invalidateQueries({ queryKey: ["label-info"] });
    },
  });
}

export function useLabelInfoQuery(name: string, spaceId?: string) {
  return useQuery({
    enabled: !!name,
    placeholderData: keepPreviousData,
    queryFn: () => getLabelInfo({ name, spaceId, type: "page" }),
    queryKey: ["label-info", name, spaceId ?? ""],
  });
}

const LABEL_PAGES_LIMIT = 25;

export function useLabelPagesQuery(
  name: string,
  query: string,
  spaceId?: string
) {
  return useInfiniteQuery({
    enabled: !!name,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage
        ? (lastPage.meta.nextCursor ?? undefined)
        : undefined,
    initialPageParam: undefined as string | undefined,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      findPagesByLabel({
        cursor: pageParam,
        limit: LABEL_PAGES_LIMIT,
        name,
        query,
        spaceId,
      }),
    queryKey: ["label-pages", name, query, spaceId ?? ""],
  });
}
