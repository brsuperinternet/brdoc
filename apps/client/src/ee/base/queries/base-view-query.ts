import { useMutation } from "@tanstack/react-query";
import {
  createView,
  deleteView,
  updateView,
} from "@/ee/base/services/base-service";
import {
  CreateViewInput,
  DeleteViewInput,
  IBase,
  IBaseView,
  UpdateViewInput,
  ViewConfig,
  ViewConfigPatch,
} from "@/ee/base/types/base.types";

function applyConfigPatch(
  existing: ViewConfig | undefined,
  patch: ViewConfigPatch | undefined
): ViewConfig {
  const merged: Record<string, unknown> = { ...(existing ?? {}) };
  for (const [key, value] of Object.entries(patch ?? {})) {
    if (value === null) {
      delete merged[key];
    } else if (value !== undefined) {
      merged[key] = value;
    }
  }
  return merged as ViewConfig;
}

import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "@/lib/api-error";
import { queryClient } from "@/main";

export function useCreateViewMutation() {
  const { t } = useTranslation();
  return useMutation<IBaseView, Error, CreateViewInput>({
    mutationFn: (data) => createView(data),
    onError: (error) => {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to create view")),
      });
    },
    onSuccess: (newView) => {
      queryClient.setQueryData<IBase>(["bases", newView.pageId], (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          views: [...old.views, newView],
        };
      });
    },
  });
}

export function useUpdateViewMutation() {
  const { t } = useTranslation();
  return useMutation<
    IBaseView,
    Error,
    UpdateViewInput,
    { previous: IBase | undefined }
  >({
    mutationFn: (data) => updateView(data),
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bases", variables.pageId], context.previous);
      }
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to update view")),
      });
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["bases", variables.pageId],
      });

      const previous = queryClient.getQueryData<IBase>([
        "bases",
        variables.pageId,
      ]);

      queryClient.setQueryData<IBase>(["bases", variables.pageId], (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          views: old.views.map((v) =>
            v.id === variables.viewId
              ? {
                  ...v,
                  ...(variables.name !== undefined && {
                    name: variables.name,
                  }),
                  ...(variables.type !== undefined && {
                    type: variables.type,
                  }),
                  ...(variables.config !== undefined && {
                    config: applyConfigPatch(v.config, variables.config),
                  }),
                  ...(variables.position !== undefined && {
                    position: variables.position,
                  }),
                }
              : v
          ),
        };
      });

      return { previous };
    },
    onSuccess: (updatedView) => {
      queryClient.setQueryData<IBase>(["bases", updatedView.pageId], (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          views: old.views.map((v) =>
            v.id === updatedView.id ? updatedView : v
          ),
        };
      });
    },
  });
}

export function useDeleteViewMutation() {
  const { t } = useTranslation();
  return useMutation<void, Error, DeleteViewInput>({
    mutationFn: (data) => deleteView(data),
    onError: (error) => {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to delete view")),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData<IBase>(["bases", variables.pageId], (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          views: old.views.filter((v) => v.id !== variables.viewId),
        };
      });
    },
  });
}
