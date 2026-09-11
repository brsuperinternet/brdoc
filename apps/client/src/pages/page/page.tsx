import { Button } from "@mantine/core";
import { IconAlertTriangle, IconFileOff } from "@tabler/icons-react";
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { EmptyState } from "@/components/ui/empty-state.tsx";

import { FullEditor } from "@/features/editor/full-editor";
import PageHeader from "@/features/page/components/header/page-header.tsx";
import { getPageTitle } from "@/features/page/page.utils";
import { usePageQuery } from "@/features/page/queries/page-query";
import HistoryModal from "@/features/page-history/components/history-modal";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { extractPageSlugId } from "@/lib";

const MemoizedFullEditor = React.memo(FullEditor);
const MemoizedPageHeader = React.memo(PageHeader);
const MemoizedHistoryModal = React.memo(HistoryModal);

export default function Page() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();

  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <EmptyState
          action={
            <Button
              mt="xs"
              onClick={resetErrorBoundary}
              size="sm"
              variant="default"
            >
              {t("Try again")}
            </Button>
          }
          icon={IconAlertTriangle}
          title={t("Failed to load page. An error occurred.")}
        />
      )}
      resetKeys={[pageSlug]}
    >
      <PageContent pageSlug={pageSlug} />
    </ErrorBoundary>
  );
}

function PageContent({ pageSlug }: { pageSlug: string | undefined }) {
  const { t } = useTranslation();

  const {
    data: page,
    isLoading,
    isError,
    error,
  } = usePageQuery({ pageId: extractPageSlugId(pageSlug) });
  const { data: space } = useGetSpaceBySlugQuery(page?.space?.slug);

  const canEdit = !page?.deletedAt && (page?.permissions?.canEdit ?? false);
  const canComment =
    canEdit || space?.settings?.comments?.allowViewerComments === true;

  if (isLoading) {
    return null;
  }

  if (isError || !page) {
    if ([401, 403, 404].includes(error?.["status"])) {
      return (
        <EmptyState
          action={
            <Button
              component={Link}
              mt="xs"
              size="sm"
              to="/home"
              variant="default"
            >
              {t("Go to homepage")}
            </Button>
          }
          description={t(
            "This page may have been deleted, moved, or you may not have access."
          )}
          icon={IconFileOff}
          title={t("Page not found")}
        />
      );
    }
    return (
      <EmptyState icon={IconFileOff} title={t("Error fetching page data.")} />
    );
  }

  if (!space) {
    return <></>;
  }

  if (page?.isBase) {
    return (
      <div
        className="base-page-root"
        style={{
          display: "flex",
          flexDirection: "column",
          // Height: see `.base-page-root` in core.css.
          // Clear the fixed PageHeader (breadcrumb) plus a little extra so the
          // pinned column-header row isn't tucked half under it.
          paddingTop: "calc(var(--page-header-height) + 6px)",
        }}
      >
        <DocumentTitle
          title={`${page?.icon || ""}  ${getPageTitle(page?.title, page?.isBase, t)}`}
          withAppName={false}
        />
        <MemoizedPageHeader readOnly={!canEdit} />
      </div>
    );
  }

  return (
    page && (
      <div>
        <DocumentTitle
          title={`${page?.icon || ""}  ${getPageTitle(page?.title, page?.isBase, t)}`}
          withAppName={false}
        />

        <MemoizedPageHeader readOnly={!canEdit} />

        <MemoizedFullEditor
          canComment={canComment}
          content={page.content}
          contributors={page.contributors}
          creator={page.creator}
          editable={canEdit}
          key={page.id}
          pageId={page.id}
          slugId={page.slugId}
          spaceSlug={page?.space?.slug}
          title={page.title}
        />
        <MemoizedHistoryModal pageId={page.id} />
      </div>
    )
  );
}
