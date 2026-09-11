import {
  Button,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  TextInput,
  useComputedColorScheme,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconChevronDown, IconLabel, IconSearch } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { EmptyState } from "@/components/ui/empty-state";
import { LabelPageRow } from "@/features/label/components/label-page-row.tsx";
import { LabelPageRowSkeleton } from "@/features/label/components/label-page-row-skeleton.tsx";
import classes from "@/features/label/label.module.css";
import { useLabelPagesQuery } from "@/features/label/queries/label-query.ts";
import { getLabelColor } from "@/features/label/utils/label-colors.ts";
import { normalizeLabelName } from "@/features/label/utils/normalize-label.ts";
import { SpaceFilterMenu } from "@/features/space/components/space-filter-menu.tsx";
import { useGetSpacesQuery } from "@/features/space/queries/space-query.ts";

export default function LabelPage() {
  const { t } = useTranslation();
  const { labelName: rawName } = useParams<{ labelName: string }>();
  const labelName = normalizeLabelName(decodeURIComponent(rawName ?? ""));
  const scheme = useComputedColorScheme("light");
  const c = getLabelColor(labelName, scheme);

  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search.trim(), 200);

  const activeSpaceId = spaceId ?? undefined;

  const { data: spacesData } = useGetSpacesQuery({ limit: 100 });
  const spaces = spacesData?.items ?? [];

  const {
    data: pagesData,
    isLoading: pagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useLabelPagesQuery(labelName, debouncedSearch, activeSpaceId);

  const pages = useMemo(
    () => pagesData?.pages.flatMap((p: any) => p.items) ?? [],
    [pagesData]
  );

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const selectedSpaceName = useMemo(() => {
    if (!spaceId) {
      return t("All spaces");
    }
    return spaces.find((s) => s.id === spaceId)?.name ?? t("All spaces");
  }, [spaceId, spaces, t]);

  return (
    <>
      <DocumentTitle title={labelName} />

      <Container py="xl" size={820}>
        <Stack gap="lg">
          <Stack gap="sm">
            <Text c="dimmed" size="sm">
              {t("Labels")}
              {" / "}
              <Text c="bright" component="span" fw={500}>
                {labelName}
              </Text>
            </Text>

            <Group align="center" gap="md" wrap="nowrap">
              <Link
                className={classes.headerChip}
                style={{ background: c.bg, color: c.fg }}
                to={`/labels/${encodeURIComponent(labelName)}`}
              >
                <span
                  className={classes.headerDot}
                  style={{ background: c.dot }}
                />
                <span>{labelName}</span>
              </Link>
            </Group>
          </Stack>

          <Group align="center" gap="sm" wrap="nowrap">
            <TextInput
              leftSection={<IconSearch size={16} />}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search by title")}
              size="sm"
              style={{ flex: 1 }}
              value={search}
            />
            <SpaceFilterMenu onChange={setSpaceId} value={spaceId}>
              <Button
                rightSection={<IconChevronDown size={14} />}
                size="sm"
                variant="default"
              >
                {selectedSpaceName}
              </Button>
            </SpaceFilterMenu>
          </Group>

          {pagesLoading && pages.length === 0 ? (
            <div>
              <LabelPageRowSkeleton metaWidth={170} titleWidth={260} />
              <LabelPageRowSkeleton metaWidth={150} titleWidth={180} />
              <LabelPageRowSkeleton metaWidth={190} titleWidth={220} />
              <LabelPageRowSkeleton metaWidth={140} titleWidth={140} />
              <LabelPageRowSkeleton metaWidth={170} titleWidth={240} />
            </div>
          ) : pages.length > 0 ? (
            <div>
              {pages.map((page) => (
                <LabelPageRow
                  currentLabelName={labelName}
                  key={page.id}
                  page={page}
                />
              ))}
              <div ref={sentinelRef} />
              {isFetchingNextPage && (
                <Center py="md">
                  <Loader size="sm" />
                </Center>
              )}
            </div>
          ) : (
            <EmptyState
              description={
                debouncedSearch
                  ? t("No pages match your search.")
                  : t("Pages tagged with this label will appear here.")
              }
              icon={IconLabel}
              title={
                debouncedSearch
                  ? t("No matches")
                  : t("No pages with this label")
              }
            />
          )}
        </Stack>
      </Container>
    </>
  );
}
