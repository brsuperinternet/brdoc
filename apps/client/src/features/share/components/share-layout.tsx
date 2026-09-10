import "@fontsource-variable/inter";
import "@/styles/public-typography.css";
import { useSetAtom } from "jotai";
import { useEffect, useMemo } from "react";
import { Outlet, useParams } from "react-router-dom";
import { buildSharedPageUrl } from "@/features/page/page.utils.ts";
import DocsShell from "@/features/public-space/components/docs/docs-shell.tsx";
import { DocsSurface } from "@/features/public-space/components/docs/docs-surface-context.tsx";
import { useDocsAccent } from "@/features/public-space/theme/docs-theme.ts";
import { ShareSearchSpotlight } from "@/features/search/components/share-search-spotlight.tsx";
import { shareSearchSpotlight } from "@/features/search/constants";
import {
  sharedPageTreeAtom,
  sharedTreeDataAtom,
} from "@/features/share/atoms/shared-page-atom.ts";
import { useGetSharedPageTreeQuery } from "@/features/share/queries/share-query.ts";
import { buildSharedPageTree } from "@/features/share/utils.ts";

export default function ShareLayout() {
  const { shareId } = useParams();
  const { data } = useGetSharedPageTreeQuery(shareId);

  // Shares have no appearance settings; apply the default docs accent.
  useDocsAccent(undefined);

  const setSharedPageTree = useSetAtom(sharedPageTreeAtom);
  const setSharedTreeData = useSetAtom(sharedTreeDataAtom);

  const treeData = useMemo(() => {
    if (!data?.pageTree) {
      return null;
    }
    return buildSharedPageTree(data.pageTree);
  }, [data?.pageTree]);

  useEffect(() => {
    setSharedPageTree(data || null);
    setSharedTreeData(treeData);
  }, [data, treeData, setSharedPageTree, setSharedTreeData]);

  const surface = useMemo<DocsSurface>(
    () => ({
      brandingRef: "public-share",
      getNodeUrl: (node) =>
        buildSharedPageUrl({
          pageSlugId: node.slugId,
          pageTitle: node.name,
          shareId,
        }),
      hasSidebar: (data?.pageTree?.length ?? 0) > 1,
      showBranding: Boolean(data),
      showEditPage: true,
      treeData,
    }),
    [data, treeData, shareId]
  );

  return (
    <DocsShell
      onSearchOpen={shareId ? shareSearchSpotlight.open : undefined}
      searchSpotlight={
        shareId ? <ShareSearchSpotlight shareId={shareId} /> : undefined
      }
      surface={surface}
    >
      <Outlet />
    </DocsShell>
  );
}
