import { notifications } from "@mantine/notifications";
import {
  InfiniteData,
  keepPreviousData,
  UseQueryResult,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAtom, useStore } from "jotai";
import { useTranslation } from "react-i18next";
import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  getTemplates,
  updateTemplate,
  useTemplate,
} from "@/ee/template/services/template-service.ts";
import { ITemplate } from "@/ee/template/types/template.types";
import { invalidateOnCreatePage } from "@/features/page/queries/page-query.ts";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom.ts";
import { treeModel } from "@/features/page/tree/model/tree-model";
import { SpaceTreeNode } from "@/features/page/tree/types.ts";
import { IPage } from "@/features/page/types/page.types.ts";
import { useQueryEmit } from "@/features/websocket/use-query-emit.ts";
import { IPagination } from "@/lib/types.ts";

export function useGetTemplatesQuery(params?: { spaceId?: string }) {
  const { spaceId } = params ?? {};
  return useInfiniteQuery({
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      getTemplates({ cursor: pageParam, limit: 30, spaceId }),
    queryKey: ["templates", { spaceId }],
  });
}

export function useGetTemplateByIdQuery(
  templateId: string
): UseQueryResult<ITemplate, Error> {
  return useQuery({
    enabled: !!templateId,
    queryFn: () => getTemplateById(templateId),
    queryKey: ["template", templateId],
  });
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<ITemplate, Error, Partial<ITemplate>>({
    mutationFn: (data) => createTemplate(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage
          ? t(errorMessage)
          : t("Failed to create template"),
      });
    },
    onSuccess: (newTemplate) => {
      queryClient.setQueriesData<InfiniteData<IPagination<ITemplate>>>(
        { queryKey: ["templates"] },
        (old) => {
          if (!old) {
            return old;
          }
          const firstPage = old.pages[0];
          return {
            ...old,
            pages: [
              { ...firstPage, items: [newTemplate, ...firstPage.items] },
              ...old.pages.slice(1),
            ],
          };
        }
      );
      notifications.show({ message: t("Template created successfully") });
    },
  });
}

export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<
    ITemplate,
    Error,
    Partial<ITemplate> & { templateId: string }
  >({
    mutationFn: (data) => updateTemplate(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage
          ? t(errorMessage)
          : t("Failed to update template"),
      });
    },
    onSuccess: (updatedTemplate) => {
      queryClient.setQueriesData<InfiniteData<IPagination<ITemplate>>>(
        { queryKey: ["templates"] },
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === updatedTemplate.id ? updatedTemplate : item
              ),
            })),
          };
        }
      );
      queryClient.setQueryData(
        ["template", updatedTemplate.id],
        updatedTemplate
      );
    },
  });
}

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, string>({
    mutationFn: (templateId) => deleteTemplate(templateId),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to delete template"),
      });
    },
    onSuccess: (_data, templateId) => {
      queryClient.setQueriesData<InfiniteData<IPagination<ITemplate>>>(
        { queryKey: ["templates"] },
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== templateId),
            })),
          };
        }
      );
      notifications.show({ message: t("Template deleted") });
    },
  });
}

export function useUseTemplateMutation() {
  const { t } = useTranslation();
  const [, setTreeData] = useAtom(treeDataAtom);
  const store = useStore();
  const emit = useQueryEmit();

  return useMutation<
    IPage,
    Error,
    { templateId: string; spaceId: string; parentPageId?: string }
  >({
    mutationFn: (data) => useTemplate(data),
    onError: (error) => {
      const errorMessage = error["response"]?.data?.message;
      notifications.show({
        color: "red",
        message: errorMessage || t("Failed to create page from template"),
      });
    },
    onSuccess: (page) => {
      // React Query sidebar-pages cache update (same path useCreatePageMutation takes).
      invalidateOnCreatePage(page);

      const parentId = page.parentPageId ?? null;
      const newNode: SpaceTreeNode = {
        children: [],
        hasChildren: false,
        icon: page.icon,
        id: page.id,
        name: page.title,
        parentPageId: page.parentPageId,
        position: page.position,
        slugId: page.slugId,
        spaceId: page.spaceId,
      };

      // Only mutate the tree atom and broadcast if it currently represents
      // this space. Cross-space template-use (e.g., from the gallery picking
      // a different space) lets the target space's clients pick up the new
      // page on their next React Query refetch (focus, navigation, etc.).
      // Without this guard we'd both pollute the local tree and send a wrong
      // `index` to remote clients in the target space.
      const current = store.get(treeDataAtom);
      const treeIsForThisSpace = current[0]?.spaceId === page.spaceId;
      if (!treeIsForThisSpace) {
        return;
      }

      const lastIndex =
        parentId === null
          ? current.length
          : (treeModel.find(current, parentId)?.children?.length ?? 0);

      setTreeData((prev) =>
        treeModel.insert(prev, parentId, newNode, lastIndex)
      );

      setTimeout(() => {
        emit({
          operation: "addTreeNode",
          payload: {
            data: newNode,
            index: lastIndex,
            parentId,
          },
          spaceId: page.spaceId,
        });
      }, 50);
    },
  });
}
