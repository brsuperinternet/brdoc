import { ActionIcon } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { useAtom, useSetAtom } from "jotai";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import {
  DocTree,
  type DocTreeApi,
  type RenderRowProps,
} from "@/features/page/tree/components/doc-tree";
import {
  docsMobileSidebarAtom,
  openPublicSpaceTreeNodesAtom,
} from "@/features/public-space/atoms/public-space-atoms.ts";
import { useDocsSurface } from "@/features/public-space/components/docs/docs-surface-context.tsx";
import { findAncestorTrail } from "@/features/public-space/utils/docs-tree.ts";
import { SharedPageTreeNode } from "@/features/share/utils.ts";
import { extractPageSlugId } from "@/lib";
import styles from "./docs.module.css";

export default function DocsSidebarTree() {
  const { t } = useTranslation();
  const treeRef = useRef<DocTreeApi | null>(null);
  const { pageSlug } = useParams();
  const { treeData, getNodeUrl } = useDocsSurface();
  const [openTreeNodes, setOpenTreeNodes] = useAtom(
    openPublicSpaceTreeNodesAtom
  );

  // The first root page is the surface home, served at the bare URL.
  const firstRootSlugId = treeData?.[0]?.slugId;

  const currentNodeId = pageSlug
    ? extractPageSlugId(pageSlug)
    : firstRootSlugId;

  const openIds = useMemo(
    () => new Set(Object.keys(openTreeNodes).filter((k) => openTreeNodes[k])),
    [openTreeNodes]
  );

  useEffect(() => {
    // Auto-open the first level of the tree on initial load.
    const root = treeData?.[0];
    if (!root) {
      return;
    }
    setOpenTreeNodes((prev) => {
      if (prev[root.slugId]) {
        return prev;
      }
      const next = { ...prev, [root.slugId]: true };
      for (const child of root.children ?? []) {
        next[child.slugId] = true;
      }
      return next;
    });
  }, [treeData, setOpenTreeNodes]);

  // Reveal the current page: expand its ancestor trail (deep links land with
  // everything collapsed otherwise) and the page itself when it has children.
  useEffect(() => {
    if (!(currentNodeId && treeData?.length)) {
      return;
    }
    const trail = findAncestorTrail(treeData, currentNodeId);
    if (trail === null) {
      return;
    }
    setOpenTreeNodes((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const node of [...trail.map((n) => n.slugId), currentNodeId]) {
        if (!next[node]) {
          next[node] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [currentNodeId, treeData, setOpenTreeNodes]);

  useEffect(() => {
    if (currentNodeId) {
      treeRef.current?.select(currentNodeId, { scrollIntoView: true });
    }
  }, [currentNodeId, treeData]);

  const handleToggle = useCallback(
    (id: string, isOpen: boolean) =>
      setOpenTreeNodes((prev) => ({ ...prev, [id]: isOpen })),
    [setOpenTreeNodes]
  );
  const getDragLabel = useCallback(
    (n: SharedPageTreeNode) => n.name || "untitled",
    []
  );

  const renderRow = useCallback(
    (props: RenderRowProps<SharedPageTreeNode>) => (
      <DocsTreeRow {...props} getNodeUrl={getNodeUrl} />
    ),
    [getNodeUrl]
  );

  if (!treeData?.length) {
    return null;
  }

  return (
    <DocTree<SharedPageTreeNode>
      aria-label={t("Pages")}
      data={treeData}
      dynamicRowHeight
      getDragLabel={getDragLabel}
      indentPerLevel={INDENT_PER_LEVEL}
      onMove={noopMove}
      onToggle={handleToggle}
      openIds={openIds}
      readOnly
      ref={treeRef}
      renderRow={renderRow}
      rowClassName={styles.treeNodeChrome}
      rowHeight={36}
      selectedId={currentNodeId}
    />
  );
}

// Module-scope noop so it's a stable reference across renders.
const noopMove = () => {};

const INDENT_PER_LEVEL = 16;

type DocsTreeRowProps = RenderRowProps<SharedPageTreeNode> & {
  getNodeUrl: (node: Pick<SharedPageTreeNode, "slugId" | "name">) => string;
};

function DocsTreeRow({
  node,
  level,
  isOpen,
  hasChildren,
  isSelected,
  rowRef,
  tabIndex,
  treeItemProps,
  toggleOpen,
  getNodeUrl,
}: DocsTreeRowProps) {
  const { t } = useTranslation();
  const setMobileSidebarOpen = useSetAtom(docsMobileSidebarAtom);

  return (
    <Link
      ref={rowRef as React.Ref<HTMLAnchorElement>}
      tabIndex={tabIndex}
      {...treeItemProps}
      className={styles.treeRow}
      data-open-parent={(level === 0 && isOpen && hasChildren) || undefined}
      data-selected={isSelected || undefined}
      onClick={() => {
        setMobileSidebarOpen(false);
      }}
      to={getNodeUrl(node)}
    >
      {/* One segment per ancestor level; contiguous rows join into a rail. */}
      {Array.from({ length: level }, (_, ancestor) => (
        <span
          aria-hidden
          className={styles.treeGuide}
          key={ancestor}
          style={{ left: -((level - ancestor) * INDENT_PER_LEVEL - 6) }}
        />
      ))}
      {node.icon && (
        <span aria-hidden className={styles.treeIcon}>
          {node.icon}
        </span>
      )}
      <span className={styles.treeText}>{node.name || t("untitled")}</span>
      {hasChildren && (
        <ActionIcon
          aria-hidden
          color="gray"
          component="span"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleOpen();
          }}
          size={20}
          tabIndex={-1}
          variant="subtle"
        >
          <IconChevronRight
            className={styles.treeChevron}
            data-open={isOpen || undefined}
            size={14}
            stroke={2}
          />
        </ActionIcon>
      )}
    </Link>
  );
}
