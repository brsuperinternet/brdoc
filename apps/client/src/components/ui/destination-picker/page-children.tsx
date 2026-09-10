import { Loader } from "@mantine/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getSidebarPages } from "@/features/page/services/page-service";
import { IPage } from "@/features/page/types/page.types";
import { IPagination } from "@/lib/types";
import classes from "./destination-picker.module.css";
import { PageRow } from "./page-row";

type PageChildrenProps = {
  spaceId: string;
  pageId?: string;
  depth: number;
  limit: number;
  selectedId: string | null;
  excludePageId?: string;
  onSelectPage: (page: Partial<IPage>) => void;
};

export function PageChildren({
  spaceId,
  pageId,
  depth,
  limit,
  selectedId,
  excludePageId,
  onSelectPage,
}: PageChildrenProps) {
  const { t } = useTranslation();

  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery({
    getNextPageParam: (lastPage: IPagination<IPage>) =>
      lastPage.meta?.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getSidebarPages({
        cursor: pageParam,
        limit,
        pageId,
        spaceId,
      }),
    queryKey: ["destination-pages", spaceId, pageId ?? "root"],
  });

  const pages = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className={classes.emptyState}>
        <Loader size="xs" />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className={classes.emptyState}>
        {pageId ? t("No pages inside") : t("No pages in this space")}
      </div>
    );
  }

  return (
    <>
      {pages.map((page) => (
        <PageRow
          depth={depth}
          excludePageId={excludePageId}
          key={page.id}
          limit={limit}
          onSelect={onSelectPage}
          page={page}
          selectedId={selectedId}
        />
      ))}
      {hasNextPage && (
        <div
          className={classes.loadMore}
          onClick={() => fetchNextPage()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fetchNextPage();
            }
          }}
          role="button"
          tabIndex={0}
        >
          {t("Load more")}
        </div>
      )}
    </>
  );
}
