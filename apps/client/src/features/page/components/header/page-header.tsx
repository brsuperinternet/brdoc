import { Badge, Group, Tooltip } from "@mantine/core";
import { IconExternalLink, IconWorld } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import Breadcrumb from "@/features/page/components/breadcrumbs/breadcrumb.tsx";
import PageHeaderMenu from "@/features/page/components/header/page-header-menu.tsx";
import { buildPublicSpaceUrl } from "@/features/page/page.utils.ts";
import { usePageQuery } from "@/features/page/queries/page-query.ts";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { extractPageSlugId } from "@/lib";
import { isBetaPublicSpaces } from "@/lib/config.ts";
import classes from "./page-header.module.css";

interface Props {
  readOnly?: boolean;
}
export default function PageHeader({ readOnly }: Props) {
  const { t } = useTranslation();
  const { spaceSlug, pageSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);
  const { data: page } = usePageQuery({
    pageId: extractPageSlugId(pageSlug),
  });

  // Restricted pages are never publicly reachable, so the chip only shows on
  // pages the public site actually serves.
  const showPublicBadge =
    isBetaPublicSpaces() &&
    space?.isPublished &&
    page &&
    page.permissions?.hasRestriction !== true;

  return (
    <div className={classes.header} data-page-header="true">
      <Group
        className={classes.group}
        h="100%"
        justify="space-between"
        px="md"
        wrap="nowrap"
      >
        <Group gap="xs" style={{ minWidth: 0 }} wrap="nowrap">
          <Breadcrumb />

          {showPublicBadge && (
            <Tooltip label={t("Open public page")} openDelay={250} withArrow>
              <Badge
                component="a"
                href={buildPublicSpaceUrl({
                  pageSlugId: page.slugId,
                  pageTitle: page.title,
                  spaceSlug: space.slug,
                })}
                leftSection={<IconWorld size={12} />}
                rel="noopener"
                rightSection={<IconExternalLink size={11} />}
                size="sm"
                style={{ cursor: "pointer", flexShrink: 0 }}
                target="_blank"
                variant="light"
              >
                {t("Public")}
              </Badge>
            </Tooltip>
          )}
        </Group>

        <Group
          gap="var(--mantine-spacing-xs)"
          h="100%"
          justify="flex-end"
          px="md"
          wrap="nowrap"
        >
          <PageHeaderMenu readOnly={readOnly} />
        </Group>
      </Group>
    </div>
  );
}
