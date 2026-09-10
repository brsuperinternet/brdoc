import { notifications } from "@mantine/notifications";
import { InfiniteData, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  createProperty,
  deleteProperty,
  reorderProperty,
  updateProperty,
} from "@/ee/base/services/base-service";
import {
  CreatePropertyInput,
  DeletePropertyInput,
  IBase,
  IBaseProperty,
  IBaseRow,
  ReorderPropertyInput,
  UpdatePropertyInput,
  UpdatePropertyResult,
} from "@/ee/base/types/base.types";
import { getApiErrorMessage } from "@/lib/api-error";
import { IPagination } from "@/lib/types";
import { queryClient } from "@/main";

export function useCreatePropertyMutation() {
  const { t } = useTranslation();
  return useMutation<IBaseProperty, Error, CreatePropertyInput>({
    mutationFn: (data) => createProperty(data),
    onError: (error) => {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to create property")),
      });
    },
    onSuccess: (newProperty) => {
      queryClient.setQueryData<IBase>(["bases", newProperty.pageId], (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          properties: [...old.properties, newProperty],
        };
      });
    },
  });
}

export function useUpdatePropertyMutation() {
  const { t } = useTranslation();
  return useMutation<UpdatePropertyResult, Error, UpdatePropertyInput>({
    mutationFn: (data) => updateProperty(data),
    onError: (error) => {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to update property")),
      });
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData<IBase>(["bases", variables.pageId], (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          properties: old.properties.map((p) =>
            p.id === result.property.id ? result.property : p
          ),
        };
      });

      if (variables.type && !result.jobId) {
        queryClient.invalidateQueries({
          queryKey: ["base-rows", variables.pageId],
        });
      }
    },
  });
}

export function useDeletePropertyMutation() {
  const { t } = useTranslation();
  return useMutation<void, Error, DeletePropertyInput>({
    mutationFn: (data) => deleteProperty(data),
    onError: (error) => {
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to delete property")),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.setQueryData<IBase>(["bases", variables.pageId], (old) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          properties: old.properties.filter(
            (p) => p.id !== variables.propertyId
          ),
        };
      });

      queryClient.setQueriesData<InfiniteData<IPagination<IBaseRow>>>(
        { queryKey: ["base-rows", variables.pageId] },
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((row) => {
                if (!(variables.propertyId in row.cells)) {
                  return row;
                }
                const { [variables.propertyId]: _, ...rest } = row.cells;
                return { ...row, cells: rest };
              }),
            })),
          };
        }
      );
    },
  });
}

export function useReorderPropertyMutation() {
  const { t } = useTranslation();
  return useMutation<
    void,
    Error,
    ReorderPropertyInput,
    { previous: IBase | undefined }
  >({
    mutationFn: (data) => reorderProperty(data),
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bases", variables.pageId], context.previous);
      }
      notifications.show({
        color: "red",
        message: getApiErrorMessage(error, t("Failed to reorder property")),
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
          properties: old.properties.map((p) =>
            p.id === variables.propertyId
              ? { ...p, position: variables.position }
              : p
          ),
        };
      });

      return { previous };
    },
  });
}
