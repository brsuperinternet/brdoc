import { notifications } from "@mantine/notifications";
import { UseQueryResult, useMutation, useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import {
  convertPageToBase,
  createBase,
  deleteBase,
  getBaseInfo,
  updateBase,
} from "@/ee/base/services/base-service";
import {
  CreateBaseInput,
  IBase,
  UpdateBaseInput,
} from "@/ee/base/types/base.types";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom";
import { treeModel } from "@/features/page/tree/model/tree-model";
import { SpaceTreeNode } from "@/features/page/tree/types";
import { IPage } from "@/features/page/types/page.types";
import { socketAtom } from "@/features/websocket/atoms/socket-atom";
import { getApiErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/main";

export function useBaseQuery(
  pageId: string | undefined
): UseQueryResult<IBase, Error> {
  return useQuery({
    enabled: !!pageId,
    queryFn: () => getBaseInfo(pageId!),
    queryKey: ["bases", pageId],
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBaseMutation() {
  const { t } = useTranslation();
  return useMutation<IBase, Error, CreateBaseInput>({
    mutationFn: (data) => createBase(data),
    onError: (error) => {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to create base")),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["bases", "list", data.spaceId],
      });
    },
  });
}

export function useConvertPageToBaseMutation() {
  const { t } = useTranslation();
  const [, setTreeData] = useAtom(treeDataAtom);
  const [socket] = useAtom(socketAtom);

  return useMutation<IBase, Error, { pageId: string; template?: "kanban" }>({
    mutationFn: ({ pageId, template }) => convertPageToBase(pageId, template),
    onError: (error) => {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to create base")),
      });
    },
    onSuccess: (base) => {
      const markAsBase = (old?: IPage) =>
        old ? { ...old, isBase: true } : old;
      queryClient.setQueryData<IPage>(["pages", base.id], markAsBase);
      queryClient.setQueryData<IPage>(["pages", base.slugId], markAsBase);

      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({
        queryKey: ["root-sidebar-pages", base.spaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["sidebar-pages"] });
      setTreeData((prev) =>
        treeModel.update(prev, base.id, {
          isBase: true,
        } as Partial<SpaceTreeNode>)
      );
      socket?.emit("message", {
        entity: ["pages"],
        id: base.id,
        operation: "updateOne",
        payload: { isBase: true, slugId: base.slugId },
        spaceId: base.spaceId,
      });
    },
  });
}

export function useUpdateBaseMutation() {
  const { t } = useTranslation();
  return useMutation<IBase, Error, UpdateBaseInput>({
    mutationFn: (data) => updateBase(data),
    onError: (error) => {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to update base")),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData<IBase>(["bases", data.id], (old) => {
        if (!old) {
          return old;
        }
        return { ...old, ...data };
      });
    },
  });
}

export function useDeleteBaseMutation() {
  const { t } = useTranslation();
  return useMutation<void, Error, { pageId: string; spaceId: string }>({
    mutationFn: ({ pageId }) => deleteBase(pageId),
    onError: (error) => {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to delete base")),
      });
    },
    onSuccess: (_, { pageId, spaceId }) => {
      queryClient.removeQueries({ queryKey: ["bases", pageId] });
      queryClient.invalidateQueries({
        queryKey: ["bases", "list", spaceId],
      });
      notifications.show({ message: t("Base deleted") });
    },
  });
}
