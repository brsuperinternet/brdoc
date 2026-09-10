import { notifications } from "@mantine/notifications";
import { useAtom, useStore } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import {
  updateCacheOnMovePage,
  useCreatePageMutation,
  useMovePageMutation,
  useRemovePageMutation,
  useUpdatePageMutation,
} from "@/features/page/queries/page-query.ts";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom.ts";
import { treeModel } from "@/features/page/tree/model/tree-model";
import type { DropOp } from "@/features/page/tree/model/tree-model.types";
import { SpaceTreeNode } from "@/features/page/tree/types.ts";
import {
  spaceRoots,
  updateSpaceRoots,
} from "@/features/page/tree/utils/utils.ts";
import { IPage } from "@/features/page/types/page.types.ts";
import { useQueryEmit } from "@/features/websocket/use-query-emit.ts";
import { getSpaceUrl } from "@/lib/config.ts";
import { dropOpToMovePayload } from "./drop-op-to-move-payload";

export type UseTreeMutation = {
  handleMove: (sourceId: string, op: DropOp) => Promise<void>;
  handleCreate: (parentId: string | null) => Promise<void>;
  handleRename: (id: string, name: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
};

export function useTreeMutation(spaceId: string): UseTreeMutation {
  const { t } = useTranslation();
  const [, setData] = useAtom(treeDataAtom);
  // `store` reads the *current* treeDataAtom imperatively in handlers — avoids
  // stale-closure issues when the caller updates the tree (e.g. lazy-load
  // children) and then immediately invokes a handler.
  const store = useStore();
  const createPageMutation = useCreatePageMutation();
  const updatePageMutation = useUpdatePageMutation();
  const removePageMutation = useRemovePageMutation();
  const movePageMutation = useMovePageMutation();
  const navigate = useNavigate();
  const { spaceSlug, pageSlug } = useParams();
  const emit = useQueryEmit();

  const handleMove = useCallback(
    async (sourceId: string, op: DropOp) => {
      const before = spaceRoots(store.get(treeDataAtom), spaceId);
      const { tree: after, result } = treeModel.move(before, sourceId, op);
      if (after === before) {
        return;
      }

      const payload = dropOpToMovePayload(before, sourceId, op);
      const source = treeModel.find(before, sourceId) as SpaceTreeNode | null;
      if (!source) {
        return;
      }
      const oldParentId = source.parentPageId ?? null;

      // optimistic apply with the new position from the payload
      let optimistic = treeModel.update(after, sourceId, {
        parentPageId: payload.parentPageId,
        position: payload.position,
      } as Partial<SpaceTreeNode>);

      // If the old parent has no children left, mark hasChildren: false so the
      // chevron disappears. Without this, the empty parent keeps rendering an
      // expand toggle that fetches zero rows on click.
      if (oldParentId) {
        const oldParent = treeModel.find(optimistic, oldParentId);
        if (!oldParent?.children?.length) {
          optimistic = treeModel.update(optimistic, oldParentId, {
            hasChildren: false,
          } as Partial<SpaceTreeNode>);
        }
      }

      // For make-child onto a previously-childless target: flip hasChildren on
      // so the new parent shows its chevron.
      if (op.kind === "make-child") {
        optimistic = treeModel.update(optimistic, op.targetId, {
          hasChildren: true,
        } as Partial<SpaceTreeNode>);
      }

      setData((prev) => updateSpaceRoots(prev, spaceId, () => optimistic));

      try {
        await movePageMutation.mutateAsync(payload);
      } catch {
        setData((prev) => updateSpaceRoots(prev, spaceId, () => before));
        notifications.show({
          color: "red",
          message: t("Failed to move page"),
        });
        return;
      }

      const pageData: Partial<IPage> = {
        hasChildren: source.hasChildren,
        icon: source.icon,
        id: source.id,
        parentPageId: payload.parentPageId,
        position: payload.position,
        slugId: source.slugId,
        spaceId: source.spaceId,
        title: source.name,
      };

      updateCacheOnMovePage(
        spaceId,
        sourceId,
        oldParentId,
        payload.parentPageId,
        pageData
      );

      setTimeout(() => {
        emit({
          operation: "moveTreeNode",
          payload: {
            id: sourceId,
            index: result.index,
            oldParentId,
            pageData,
            parentId: payload.parentPageId,
            position: payload.position,
          },
          spaceId,
        });
      }, 50);
    },
    [setData, store, movePageMutation, spaceId, emit, t]
  );

  const handleCreate = useCallback(
    async (parentId: string | null) => {
      const payload: { spaceId: string; parentPageId?: string } = { spaceId };
      if (parentId) {
        payload.parentPageId = parentId;
      }

      let createdPage: IPage;
      try {
        createdPage = await createPageMutation.mutateAsync(payload);
      } catch {
        throw new Error("Failed to create page");
      }

      const newNode: SpaceTreeNode = {
        children: [],
        hasChildren: false,
        id: createdPage.id,
        name: "",
        parentPageId: createdPage.parentPageId,
        position: createdPage.position,
        slugId: createdPage.slugId,
        spaceId: createdPage.spaceId,
      };

      // Read latest tree at call time. Without this, callers that mutate the
      // tree (e.g. lazy-load children on expand) immediately before calling
      // handleCreate hit a stale closure and compute lastIndex against the
      // pre-load tree, requiring a setTimeout-based wait at the call site.
      const current = spaceRoots(store.get(treeDataAtom), spaceId);
      let lastIndex: number;
      if (parentId === null) {
        lastIndex = current.length;
      } else {
        const parent = treeModel.find(current, parentId);
        lastIndex = parent?.children?.length ?? 0;
      }

      setData((prev) =>
        updateSpaceRoots(prev, spaceId, (roots) =>
          treeModel.insert(roots, parentId, newNode, lastIndex)
        )
      );

      setTimeout(() => {
        emit({
          operation: "addTreeNode",
          payload: {
            data: newNode,
            index: lastIndex,
            parentId,
          },
          spaceId,
        });
      }, 50);

      const pageUrl = buildPageUrl(
        spaceSlug,
        createdPage.slugId,
        createdPage.title
      );
      navigate(pageUrl);
    },
    [spaceId, createPageMutation, setData, store, emit, navigate, spaceSlug]
  );

  const handleRename = useCallback(
    async (id: string, name: string) => {
      setData((prev) =>
        treeModel.update(prev, id, { name } as Partial<SpaceTreeNode>)
      );
      try {
        await updatePageMutation.mutateAsync({ pageId: id, title: name });
      } catch (error) {
        console.error("Error updating page title:", error);
      }
    },
    [updatePageMutation, setData]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const node = treeModel.find(
        store.get(treeDataAtom),
        id
      ) as SpaceTreeNode | null;
      const parentPageId = node?.parentPageId ?? null;
      try {
        await removePageMutation.mutateAsync(id);
        setData((prev) => {
          let next = treeModel.remove(prev, id);
          // If the parent has no children left, mark hasChildren: false so the
          // chevron disappears. Without this, the empty parent keeps rendering an
          // expand toggle that fetches zero rows on click.
          if (parentPageId) {
            const parent = treeModel.find(next, parentPageId);
            if (!parent?.children?.length) {
              next = treeModel.update(next, parentPageId, {
                hasChildren: false,
              } as Partial<SpaceTreeNode>);
            }
          }
          return next;
        });

        if (
          node &&
          pageSlug &&
          (node.slugId === pageSlug.split("-")[1] ||
            isPageInNode(node, pageSlug.split("-")[1]))
        ) {
          navigate(getSpaceUrl(spaceSlug));
        }

        setTimeout(() => {
          if (!node) {
            return;
          }
          emit({
            operation: "deleteTreeNode",
            payload: { node },
            spaceId,
          });
        }, 50);
      } catch (error) {
        console.error("Failed to delete page:", error);
      }
    },
    [
      removePageMutation,
      setData,
      store,
      pageSlug,
      navigate,
      spaceSlug,
      emit,
      spaceId,
    ]
  );

  return { handleCreate, handleDelete, handleMove, handleRename };
}

function isPageInNode(node: SpaceTreeNode, pageSlug: string): boolean {
  if (node.slugId === pageSlug) {
    return true;
  }
  if (!node.children) {
    return false;
  }
  for (const child of node.children) {
    if (isPageInNode(child, pageSlug)) {
      return true;
    }
  }
  return false;
}
