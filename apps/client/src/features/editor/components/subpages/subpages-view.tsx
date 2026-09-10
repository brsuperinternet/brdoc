import { ActionIcon, Anchor, Stack, Text } from "@mantine/core";
import { IconFileDescription } from "@tabler/icons-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  buildPageUrl,
  buildPublicSpaceUrl,
  buildSharedPageUrl,
} from "@/features/page/page.utils.ts";
import { useGetSidebarPagesQuery } from "@/features/page/queries/page-query";
import { sortPositionKeys } from "@/features/page/tree/utils/utils";
import { publicSpaceTreeDataAtom } from "@/features/public-space/atoms/public-space-atoms.ts";
import { useSharedPageSubpages } from "@/features/share/hooks/use-shared-page-subpages";
import { findSubpagesInTree } from "@/features/share/utils";
import { extractPageSlugId } from "@/lib";
import styles from "../mention/mention.module.css";
import classes from "./subpages.module.css";

export default function SubpagesView(props: NodeViewProps) {
  const { editor } = props;
  const { spaceSlug, shareId, pageSlug } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const isPublicSpaceRoute = location.pathname.startsWith("/docs/");

  const publicSpaceTreeData = useAtomValue(publicSpaceTreeDataAtom);

  // @ts-expect-error
  const storagePageId = editor.storage.pageId;
  const routePageId = extractPageSlugId(pageSlug);
  let currentPageId = storagePageId;

  if (shareId) {
    currentPageId = routePageId;
  }

  // Public docs must resolve the page from the route, not editor storage:
  // storage.pageId is set after this view's first render and is not reactive,
  // which froze the list at "No subpages" until something re-rendered it. The
  // space home renders at the bare URL, so it falls back to the first root.
  if (isPublicSpaceRoute) {
    currentPageId = routePageId ?? publicSpaceTreeData?.[0]?.slugId;
  }

  // Get subpages from shared tree if we're in a shared context
  const sharedSubpages = useSharedPageSubpages(currentPageId);
  const publicSpaceSubpages = useMemo(
    () => findSubpagesInTree(publicSpaceTreeData, currentPageId),
    [publicSpaceTreeData, currentPageId]
  );

  const isPublicView = Boolean(shareId) || isPublicSpaceRoute;

  const { data, isLoading, error } = useGetSidebarPagesQuery(
    isPublicView ? null : { pageId: currentPageId }
  );

  const subpages = useMemo(() => {
    // If we're in a shared context, use the shared subpages
    if (shareId && sharedSubpages) {
      return sharedSubpages.map((node) => ({
        icon: node.icon,
        id: node.value,
        position: node.position,
        slugId: node.slugId,
        title: node.name,
      }));
    }

    if (isPublicSpaceRoute) {
      return publicSpaceSubpages.map((node) => ({
        icon: node.icon,
        id: node.value,
        position: node.position,
        slugId: node.slugId,
        title: node.name,
      }));
    }

    // Otherwise use the API data
    if (!data?.pages) {
      return [];
    }
    const allPages = data.pages.flatMap((page) => page.items);
    return sortPositionKeys(allPages);
  }, [data, shareId, sharedSubpages, isPublicSpaceRoute, publicSpaceSubpages]);

  if (isLoading && !isPublicView) {
    return null;
  }

  if (error && !isPublicView) {
    return (
      <NodeViewWrapper data-drag-handle>
        <Text c="dimmed" py="md" size="md">
          {t("Failed to load subpages")}
        </Text>
      </NodeViewWrapper>
    );
  }

  if (subpages.length === 0) {
    return (
      <NodeViewWrapper data-drag-handle>
        <div className={classes.container}>
          <Text c="dimmed" py="md" size="md">
            {t("No subpages")}
          </Text>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper data-drag-handle>
      <div className={classes.container}>
        <Stack gap={5}>
          {subpages.map((page) => (
            <Anchor
              className={styles.pageMentionLink}
              component={Link}
              draggable={false}
              fw={500}
              key={page.id}
              to={
                shareId
                  ? buildSharedPageUrl({
                      pageSlugId: page.slugId,
                      pageTitle: page.title,
                      shareId,
                    })
                  : isPublicSpaceRoute
                    ? buildPublicSpaceUrl({
                        pageSlugId: page.slugId,
                        pageTitle: page.title,
                        spaceSlug,
                      })
                    : buildPageUrl(spaceSlug, page.slugId, page.title)
              }
              underline="never"
            >
              {page?.icon ? (
                <span style={{ marginRight: "4px" }}>{page.icon}</span>
              ) : (
                <ActionIcon
                  color="gray"
                  component="span"
                  size={18}
                  style={{ verticalAlign: "text-bottom" }}
                  variant="transparent"
                >
                  <IconFileDescription size={18} />
                </ActionIcon>
              )}

              <span className={styles.pageMentionText}>
                {page?.title || t("untitled")}
              </span>
            </Anchor>
          ))}
        </Stack>
      </div>
    </NodeViewWrapper>
  );
}
