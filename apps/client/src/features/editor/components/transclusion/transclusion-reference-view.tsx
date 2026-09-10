import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import {
  IconDots,
  IconLinkOff,
  IconPencil,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { buildPageUrl } from "@/features/page/page.utils";
import SyncBlockReferencesDropdown from "@/features/transclusion/components/sync-block-references-dropdown";
import {
  useReferencesQuery,
  useUnsyncReferenceMutation,
} from "@/features/transclusion/queries/transclusion-query";
import ErrorPlaceholder from "./error-placeholder";
import NoAccessPlaceholder from "./no-access-placeholder";
import NotFoundPlaceholder from "./not-found-placeholder";
import classes from "./transclusion.module.css";
import TransclusionContent from "./transclusion-content";
import { useTransclusionLookup } from "./transclusion-lookup-context";

export default function TransclusionReferenceView(props: NodeViewProps) {
  const isEditable = props.editor.isEditable;
  const sourcePageId: string | null = props.node.attrs.sourcePageId ?? null;
  const transclusionId: string | null = props.node.attrs.transclusionId ?? null;
  const [openMenus, setOpenMenus] = useState(0);
  const trackOpen = (open: boolean) =>
    setOpenMenus((n) => Math.max(0, n + (open ? 1 : -1)));

  return (
    <NodeViewWrapper
      className={classes.includeWrap}
      contentEditable={false}
      data-editable={isEditable ? "true" : "false"}
      data-focused={isEditable && props.selected ? "true" : "false"}
      data-menu-open={openMenus > 0 ? "true" : "false"}
    >
      <ErrorBoundary
        fallback={<ErrorPlaceholder />}
        resetKeys={[sourcePageId, transclusionId]}
      >
        <TransclusionReferenceBody {...props} trackOpen={trackOpen} />
      </ErrorBoundary>
    </NodeViewWrapper>
  );
}

function TransclusionReferenceBody({
  editor,
  node,
  deleteNode,
  getPos,
  trackOpen,
}: NodeViewProps & { trackOpen: (open: boolean) => void }) {
  const { t } = useTranslation();
  const sourcePageId: string | null = node.attrs.sourcePageId ?? null;
  const transclusionId: string | null = node.attrs.transclusionId ?? null;
  const isEditable = editor.isEditable;

  const { result, refresh } = useTransclusionLookup(
    sourcePageId,
    transclusionId
  );
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };
  // @ts-expect-error - editor.storage.pageId is set by the host editor
  const hostPageId: string | undefined = editor.storage?.pageId;
  const unsyncMutation = useUnsyncReferenceMutation();
  // Cached against the dropdown's identical query so the source link target
  // is ready as soon as the controls fade in on hover, without a second
  // fetch.
  const referencesQuery = useReferencesQuery(
    sourcePageId,
    transclusionId,
    isEditable
  );
  const sourcePageHref = (() => {
    const source = referencesQuery.data?.source;
    const base = source?.spaceSlug
      ? buildPageUrl(source.spaceSlug, source.slugId, source.title)
      : sourcePageId
        ? `/p/${sourcePageId}`
        : null;
    if (!base) {
      return null;
    }
    return transclusionId ? `${base}#${transclusionId}` : base;
  })();

  const handleUnsync = async () => {
    if (!(hostPageId && sourcePageId && transclusionId)) {
      return;
    }
    try {
      const { content } = await unsyncMutation.mutateAsync({
        referencePageId: hostPageId,
        sourcePageId,
        transclusionId,
      });
      if (editor.isDestroyed) {
        return;
      }
      const pos = getPos();
      if (typeof pos !== "number") {
        return;
      }
      const from = pos;
      const to = pos + node.nodeSize;
      editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, content as any)
        .run();
    } catch {
      // mutation surfaces errors via React Query; node stays as-is
    }
  };

  return (
    <>
      {isEditable && (
        <div
          className={classes.includeControls}
          contentEditable={false}
          onMouseDown={(e) => e.preventDefault()}
        >
          {sourcePageId && transclusionId && hostPageId && (
            <SyncBlockReferencesDropdown
              currentPageId={hostPageId}
              mode="reference"
              onOpenChange={trackOpen}
              sourcePageId={sourcePageId}
              transclusionId={transclusionId}
            />
          )}
          <span className={classes.controlsDivider} />
          <Tooltip label={t("Refresh")}>
            <ActionIcon
              color="gray"
              disabled={!(sourcePageId && transclusionId)}
              loading={refreshing}
              onClick={handleRefresh}
              size="sm"
              variant="subtle"
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
          {sourcePageHref && (
            <Tooltip label={t("Edit source")}>
              <ActionIcon
                color="gray"
                component={Link}
                size="sm"
                style={{
                  borderBottom: "none",
                  textDecoration: "none",
                }}
                to={sourcePageHref}
                variant="subtle"
              >
                <IconPencil size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          <Menu onChange={trackOpen} position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon color="gray" size="sm" variant="subtle">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                disabled={
                  unsyncMutation.isPending ||
                  !hostPageId ||
                  !sourcePageId ||
                  !transclusionId
                }
                leftSection={<IconLinkOff size={14} />}
                onClick={handleUnsync}
              >
                {t("Unsync")}
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => deleteNode()}
              >
                {t("Remove from page")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )}

      {sourcePageId && transclusionId ? (
        result ? (
          "status" in result ? (
            result.status === "no_access" ? (
              <NoAccessPlaceholder />
            ) : (
              <NotFoundPlaceholder />
            )
          ) : (
            <TransclusionContent content={result.content} />
          )
        ) : (
          <div style={{ minHeight: 24 }} />
        )
      ) : (
        <NotFoundPlaceholder />
      )}
    </>
  );
}
