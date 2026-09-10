import { ActionIcon, rem } from "@mantine/core";
import {
  IconChevronDown,
  IconChevronRight,
  IconFileDescription,
  IconPlus,
  IconPointFilled,
  IconTable,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import EmojiPicker from "@/components/ui/emoji-picker.tsx";
import { getPageTitle } from "@/features/page/page.utils";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import {
  fetchAllAncestorChildren,
  useUpdatePageMutation,
} from "@/features/page/queries/page-query.ts";
import { getPageById } from "@/features/page/services/page-service.ts";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom.ts";
import { useTreeMutation } from "@/features/page/tree/hooks/use-tree-mutation.ts";
import { treeModel } from "@/features/page/tree/model/tree-model";
import classes from "@/features/page/tree/styles/tree.module.css";
import type { SpaceTreeNode } from "@/features/page/tree/types.ts";
import { updateTreeNodeIcon } from "@/features/page/tree/utils/utils.ts";
import { useQueryEmit } from "@/features/websocket/use-query-emit.ts";
import { queryClient } from "@/main.tsx";
import type { RenderRowProps } from "./doc-tree";
import { NodeMenu } from "./space-tree-node-menu";

type SpaceTreeRowProps = RenderRowProps<SpaceTreeNode> & {
  readOnly: boolean;
};

export function SpaceTreeRow({
  node,
  isOpen,
  hasChildren,
  toggleOpen,
  rowRef,
  tabIndex,
  treeItemProps,
  readOnly,
}: SpaceTreeRowProps) {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const updatePageMutation = useUpdatePageMutation();
  const [, setTreeData] = useAtom(treeDataAtom);
  const emit = useQueryEmit();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  const canEdit = !readOnly && node.canEdit !== false;
  const pageUrl = buildPageUrl(spaceSlug, node.slugId, node.name);

  const prefetchPage = () => {
    timerRef.current = setTimeout(async () => {
      const page = await queryClient.fetchQuery({
        queryFn: () => getPageById({ pageId: node.id }),
        queryKey: ["pages", node.id],
        staleTime: 5 * 60 * 1000,
      });
      if (page?.slugId) {
        queryClient.setQueryData(["pages", page.slugId], page);
      }
    }, 150);
  };

  const cancelPagePrefetch = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleUpdateNodeIcon = (nodeId: string, newIcon: string | null) => {
    setTreeData((prev) => updateTreeNodeIcon(prev, nodeId, newIcon));
  };

  const handleEmojiIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    handleUpdateNodeIcon(node.id, emoji.native);
    updatePageMutation
      .mutateAsync({ icon: emoji.native, pageId: node.id })
      .then((data) => {
        setTimeout(() => {
          emit({
            entity: ["pages"],
            id: node.id,
            operation: "updateOne",
            payload: { icon: emoji.native, parentPageId: data.parentPageId },
            spaceId: node.spaceId,
          });
        }, 50);
      });
  };

  const handleRemoveEmoji = () => {
    handleUpdateNodeIcon(node.id, null);
    updatePageMutation.mutateAsync({ icon: null, pageId: node.id });

    setTimeout(() => {
      emit({
        entity: ["pages"],
        id: node.id,
        operation: "updateOne",
        payload: { icon: null },
        spaceId: node.spaceId,
      });
    }, 50);
  };

  const handleLoadChildren = async () => {
    if (!node.hasChildren) {
      return;
    }
    try {
      const childrenTree = await fetchAllAncestorChildren({
        pageId: node.id,
        spaceId: node.spaceId,
      });
      setTreeData((prev) =>
        treeModel.appendChildren(prev, node.id, childrenTree)
      );
    } catch (error) {
      console.error("Failed to fetch children:", error);
    }
  };

  return (
    <Link
      className={classes.node}
      ref={rowRef as React.Ref<HTMLAnchorElement>}
      tabIndex={tabIndex}
      to={pageUrl}
      {...treeItemProps}
      onClick={() => {
        if (mobileSidebarOpened) {
          toggleMobileSidebar();
        }
      }}
      onMouseEnter={prefetchPage}
      onMouseLeave={cancelPagePrefetch}
    >
      <PageArrow
        hasChildren={hasChildren}
        isOpen={isOpen}
        onToggle={toggleOpen}
      />

      <div onClick={handleEmojiIconClick} style={{ marginRight: "4px" }}>
        <EmojiPicker
          actionIconProps={{ tabIndex: -1 }}
          icon={
            node.icon ? (
              node.icon
            ) : node.isBase ? (
              <IconTable size={18} />
            ) : (
              <IconFileDescription size="18" />
            )
          }
          onEmojiSelect={handleEmojiSelect}
          readOnly={!canEdit}
          removeEmojiAction={handleRemoveEmoji}
        />
      </div>

      <span className={classes.text}>
        {getPageTitle(node.name, node.isBase, t)}
      </span>

      <div className={classes.actions}>
        <NodeMenu canEdit={canEdit} node={node} />

        {canEdit && (
          <CreateNode
            hasChildren={hasChildren}
            isOpen={isOpen}
            node={node}
            onExpandTree={handleLoadChildren}
            onToggle={toggleOpen}
          />
        )}
      </div>
    </Link>
  );
}

interface PageArrowProps {
  hasChildren: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function PageArrow({ isOpen, hasChildren, onToggle }: PageArrowProps) {
  const { t } = useTranslation();

  if (!hasChildren) {
    return (
      <span
        aria-hidden
        className={classes.actionIcon}
        style={{
          alignItems: "center",
          display: "inline-flex",
          flexShrink: 0,
          height: 20,
          justifyContent: "center",
          width: 20,
        }}
      >
        <IconPointFilled size={8} />
      </span>
    );
  }

  return (
    <ActionIcon
      aria-expanded={isOpen}
      aria-label={isOpen ? t("Collapse") : t("Expand")}
      className={classes.actionIcon}
      color="gray"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      size={20}
      tabIndex={-1}
      variant="subtle"
    >
      {isOpen ? (
        <IconChevronDown size={18} stroke={2} />
      ) : (
        <IconChevronRight size={18} stroke={2} />
      )}
    </ActionIcon>
  );
}

interface CreateNodeProps {
  hasChildren: boolean;
  isOpen: boolean;
  node: SpaceTreeNode;
  onExpandTree: () => Promise<void> | void;
  onToggle: () => void;
}

function CreateNode({
  node,
  isOpen,
  hasChildren,
  onToggle,
  onExpandTree,
}: CreateNodeProps) {
  const { t } = useTranslation();
  const { handleCreate } = useTreeMutation(node.spaceId);

  async function handleClickCreate() {
    if (node.hasChildren && !hasChildren) {
      // Expand and lazy-load before creating a child. handleCreate reads the
      // latest tree imperatively (via useStore) so we no longer need a
      // setTimeout to wait for React to rerun the closure with fresh data.
      if (!isOpen) {
        onToggle();
      }
      await onExpandTree();
    } else if (!isOpen) {
      onToggle();
    }
    handleCreate(node.id);
  }

  return (
    <ActionIcon
      aria-label={t("Create subpage of {{name}}", {
        name: node.name || t("untitled"),
      })}
      className={classes.actionIcon}
      color="gray"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClickCreate();
      }}
      tabIndex={-1}
      variant="subtle"
    >
      <IconPlus stroke={2} style={{ height: rem(20), width: rem(20) }} />
    </ActionIcon>
  );
}
