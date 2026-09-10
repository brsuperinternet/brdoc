import { Skeleton, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { Error404 } from "@/components/ui/error-404.tsx";
import ReadonlyPageEditor from "@/features/editor/readonly-page-editor.tsx";
import styles from "@/features/public-space/components/docs/docs.module.css";
import DocsBreadcrumbs from "@/features/public-space/components/docs/docs-breadcrumbs.tsx";
import DocsPageNav from "@/features/public-space/components/docs/docs-page-nav.tsx";
import { usePublicSpacePageQuery } from "@/features/public-space/queries/public-space-query.ts";
import { extractPageSlugId } from "@/lib";
import { timeAgo } from "@/lib/time.ts";

export default function PublicSpacePage() {
  const { t } = useTranslation();
  const { spaceSlug, pageSlug } = useParams();

  const { data, isLoading, isError, error } = usePublicSpacePageQuery({
    pageSlugId: pageSlug ? extractPageSlugId(pageSlug) : undefined,
    spaceSlug,
  });

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

  if (data.page === null) {
    return (
      <div className={styles.emptyState}>
        <Text c="dimmed">{t("This space has no public pages yet.")}</Text>
      </div>
    );
  }

  const showAuthor =
    data.byline?.author === true && Boolean(data.page.creator?.name);
  const showUpdatedAt =
    data.byline?.updatedAt === true && Boolean(data.page.updatedAt);

  return (
    <div>
      <DocumentTitle
        title={data.page.title || data.space.name || t("untitled")}
        withAppName={false}
      >
        {!data.searchIndexing && <meta content="noindex" name="robots" />}
      </DocumentTitle>

      <DocsBreadcrumbs />

      <ReadonlyPageEditor
        byline={
          <DocsByline
            creator={showAuthor ? data.page.creator : undefined}
            updatedAt={showUpdatedAt ? data.page.updatedAt : undefined}
          />
        }
        content={data.page.content}
        key={data.page.id}
        pageId={data.page.id}
        spaceSlug={spaceSlug}
        title={data.page.title}
        trailingSpace={false}
      />

      <DocsPageNav />
    </div>
  );
}

type DocsBylineProps = {
  creator?: { name: string; avatarUrl: string };
  updatedAt?: Date | string;
};

function DocsByline({ creator, updatedAt }: DocsBylineProps) {
  const { t } = useTranslation();

  if (!(creator || updatedAt)) {
    return null;
  }

  return (
    <div className={styles.byline}>
      {creator && (
        <span className={styles.bylineAuthor}>
          <CustomAvatar
            avatarUrl={creator.avatarUrl}
            name={creator.name}
            size={20}
          />
          {t("By {{name}}", { name: creator.name })}
        </span>
      )}

      {creator && updatedAt && (
        <span aria-hidden className={styles.bylineDot}>
          •
        </span>
      )}

      {updatedAt && (
        <span>
          {t("Updated {{date}}", { date: timeAgo(new Date(updatedAt)) })}
        </span>
      )}
    </div>
  );
}
