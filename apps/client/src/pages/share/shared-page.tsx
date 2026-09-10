import { Skeleton, Stack } from "@mantine/core";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { Error404 } from "@/components/ui/error-404.tsx";
import ReadonlyPageEditor from "@/features/editor/readonly-page-editor.tsx";
import DocsBreadcrumbs from "@/features/public-space/components/docs/docs-breadcrumbs.tsx";
import DocsFooterBranding from "@/features/public-space/components/docs/docs-footer-branding.tsx";
import DocsPageNav from "@/features/public-space/components/docs/docs-page-nav.tsx";
import { sharedTreeDataAtom } from "@/features/share/atoms/shared-page-atom.ts";
import { useSharePageQuery } from "@/features/share/queries/share-query.ts";
import { isPageInTree } from "@/features/share/utils.ts";
import { extractPageSlugId } from "@/lib";

export default function SharedPage() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();
  const { shareId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useSharePageQuery({
    pageId: extractPageSlugId(pageSlug),
  });

  const sharedTreeData = useAtomValue(sharedTreeDataAtom);

  useEffect(() => {
    if (shareId && data && data.share.key !== shareId) {
      // Check if the current page is part of the active sharing tree (sidebar) - If we are part of it, we will not redirect, keeping the sidebar visible.
      const isPartOfTree =
        sharedTreeData && isPageInTree(sharedTreeData, data.page.slugId);

      if (!isPartOfTree) {
        navigate(`/share/${data.share.key}/p/${pageSlug}`, { replace: true });
      }
    }
  }, [shareId, data, sharedTreeData]);

  if (isLoading) {
    return (
      <Stack aria-hidden gap="md" pt={4}>
        <Skeleton height={13} radius="sm" width={180} />
        <Skeleton height={34} mt={10} radius="sm" width="55%" />
        <Skeleton height={12} mt={18} radius="sm" width="90%" />
        <Skeleton height={12} radius="sm" width="97%" />
        <Skeleton height={12} radius="sm" width="85%" />
        <Skeleton height={12} radius="sm" width="60%" />
      </Stack>
    );
  }

  if (isError || !data) {
    if ([401, 403, 404].includes(error?.["status"])) {
      return <Error404 />;
    }
    return <div>{t("Error fetching page data.")}</div>;
  }

  return (
    <div>
      <DocumentTitle
        title={data?.page?.title || t("untitled")}
        withAppName={false}
      >
        {!data?.share.searchIndexing && (
          <meta content="noindex" name="robots" />
        )}
      </DocumentTitle>

      <DocsBreadcrumbs />

      <ReadonlyPageEditor
        content={data.page.content}
        key={data.page.id}
        pageId={data.page.id}
        shareId={data.share.id}
        title={data.page.title}
        trailingSpace={false}
      />

      <DocsPageNav />

      {/* No tree query without a shareId, so the shell can't own branding here. */}
      {!shareId && <DocsFooterBranding refSource="public-share" />}
    </div>
  );
}
