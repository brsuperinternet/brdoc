import type { SiblingsInfo, TreeNode } from "./tree-model.types";

function findInternal<T extends object>(
  nodes: TreeNode<T>[],
  id: string
): { parents: TreeNode<T>[]; node: TreeNode<T> } | null {
  for (const node of nodes) {
    if (node.id === id) {
      return { node, parents: [] };
    }
    if (node.children) {
      const inner = findInternal(node.children, id);
      if (inner) {
        return { node: inner.node, parents: [node, ...inner.parents] };
      }
    }
  }
  return null;
}

export const treeModel = {
  appendChildren<T extends object>(
    tree: TreeNode<T>[],
    parentId: string,
    children: TreeNode<T>[]
  ): TreeNode<T>[] {
    let touched = false;
    const walk = (nodes: TreeNode<T>[]): TreeNode<T>[] =>
      nodes.map((n) => {
        if (n.id === parentId) {
          const existing = n.children ?? [];
          // Dedup against existing ids — auto-expand + manual toggle can race
          // and produce overlapping fetches; we don't want React to see two
          // children with the same key.
          const existingIds = new Set(existing.map((c) => c.id));
          const fresh = children.filter((c) => !existingIds.has(c.id));
          if (fresh.length === 0) {
            return n;
          }
          touched = true;
          return { ...n, children: [...existing, ...fresh] };
        }
        if (n.children) {
          const next = walk(n.children);
          if (next !== n.children) {
            return { ...n, children: next };
          }
        }
        return n;
      });
    const out = walk(tree);
    return touched ? out : tree;
  },
  find<T extends object>(tree: TreeNode<T>[], id: string): TreeNode<T> | null {
    return findInternal(tree, id)?.node ?? null;
  },

  insert<T extends object>(
    tree: TreeNode<T>[],
    parentId: string | null,
    node: TreeNode<T>,
    index?: number
  ): TreeNode<T>[] {
    if (parentId === null) {
      const idx = index ?? tree.length;
      return [...tree.slice(0, idx), node, ...tree.slice(idx)];
    }
    let touched = false;
    const walk = (nodes: TreeNode<T>[]): TreeNode<T>[] =>
      nodes.map((n) => {
        if (n.id === parentId) {
          touched = true;
          const kids = n.children ?? [];
          const idx = index ?? kids.length;
          return {
            ...n,
            children: [...kids.slice(0, idx), node, ...kids.slice(idx)],
          };
        }
        if (n.children) {
          const next = walk(n.children);
          if (next !== n.children) {
            return { ...n, children: next };
          }
        }
        return n;
      });
    const out = walk(tree);
    return touched ? out : tree;
  },

  isDescendant<T extends object>(
    tree: TreeNode<T>[],
    ancestorId: string,
    descendantId: string
  ): boolean {
    if (ancestorId === descendantId) {
      return false;
    }
    const ancestor = treeModel.find(tree, ancestorId);
    if (!ancestor?.children) {
      return false;
    }
    return findInternal(ancestor.children, descendantId) !== null;
  },

  move<T extends object>(
    tree: TreeNode<T>[],
    sourceId: string,
    op: import("./tree-model.types").DropOp
  ): { tree: TreeNode<T>[]; result: import("./tree-model.types").DropResult } {
    if (sourceId === op.targetId) {
      return { result: { index: 0, parentId: null }, tree };
    }
    if (
      !(treeModel.find(tree, sourceId) && treeModel.find(tree, op.targetId))
    ) {
      return { result: { index: 0, parentId: null }, tree };
    }
    if (treeModel.isDescendant(tree, sourceId, op.targetId)) {
      return { result: { index: 0, parentId: null }, tree };
    }

    let parentId: string | null;
    let index: number;

    if (op.kind === "make-child") {
      parentId = op.targetId;
      const target = treeModel.find(tree, op.targetId)!;
      index = target.children?.length ?? 0;
    } else {
      const info = treeModel.siblingsOf(tree, op.targetId)!;
      parentId = info.parentId;
      const sourceInfo = treeModel.siblingsOf(tree, sourceId)!;
      const sameParent = sourceInfo.parentId === parentId;
      const adjust = sameParent && sourceInfo.index < info.index ? -1 : 0;
      index = info.index + adjust + (op.kind === "reorder-after" ? 1 : 0);
    }

    const next = treeModel.place(tree, sourceId, { index, parentId });
    return { result: { index, parentId }, tree: next };
  },

  path<T extends object>(
    tree: TreeNode<T>[],
    id: string
  ): TreeNode<T>[] | null {
    const found = findInternal(tree, id);
    if (!found) {
      return null;
    }
    return [...found.parents, found.node];
  },

  place<T extends object>(
    tree: TreeNode<T>[],
    sourceId: string,
    to: { parentId: string | null; index: number }
  ): TreeNode<T>[] {
    const source = treeModel.find(tree, sourceId);
    if (!source) {
      return tree;
    }
    if (to.parentId !== null && !treeModel.find(tree, to.parentId)) {
      return tree;
    }
    const removed = treeModel.remove(tree, sourceId);
    return treeModel.insert(removed, to.parentId, source, to.index);
  },

  remove<T extends object>(tree: TreeNode<T>[], id: string): TreeNode<T>[] {
    let touched = false;
    const walk = (nodes: TreeNode<T>[]): TreeNode<T>[] => {
      const filtered = nodes.filter((n) => {
        if (n.id === id) {
          touched = true;
          return false;
        }
        return true;
      });
      return filtered.map((n) => {
        if (n.children) {
          const next = walk(n.children);
          if (next !== n.children) {
            return { ...n, children: next };
          }
        }
        return n;
      });
    };
    const out = walk(tree);
    return touched ? out : tree;
  },

  siblingsOf<T extends object>(
    tree: TreeNode<T>[],
    id: string
  ): SiblingsInfo<T> | null {
    const found = findInternal(tree, id);
    if (!found) {
      return null;
    }
    const parent = found.parents[found.parents.length - 1];
    const siblings = parent ? parent.children! : tree;
    return {
      index: siblings.findIndex((n) => n.id === id),
      parentId: parent?.id ?? null,
      siblings,
    };
  },

  // `patch` excludes `id` (immutable) and `children` (use insert / remove /
  // appendChildren for structural changes — otherwise referential identity of
  // unrelated subtrees gets blown away).
  update<T extends object>(
    tree: TreeNode<T>[],
    id: string,
    patch: Omit<Partial<T>, "id" | "children">
  ): TreeNode<T>[] {
    let touched = false;
    const walk = (nodes: TreeNode<T>[]): TreeNode<T>[] =>
      nodes.map((n) => {
        if (n.id === id) {
          touched = true;
          return { ...n, ...patch };
        }
        if (n.children) {
          const next = walk(n.children);
          if (next !== n.children) {
            return { ...n, children: next };
          }
        }
        return n;
      });
    const out = walk(tree);
    return touched ? out : tree;
  },

  visible<T extends object>(
    tree: TreeNode<T>[],
    openIds: ReadonlySet<string>
  ): TreeNode<T>[] {
    const out: TreeNode<T>[] = [];
    const walk = (nodes: TreeNode<T>[]) => {
      for (const node of nodes) {
        out.push(node);
        if (openIds.has(node.id) && node.children?.length) {
          walk(node.children);
        }
      }
    };
    walk(tree);
    return out;
  },
};
