import { ActionIcon, Anchor, Text } from "@mantine/core";
import { IconFileDescription } from "@tabler/icons-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  buildPageUrl,
  buildPublicSpaceUrl,
  buildSharedPageUrl,
} from "@/features/page/page.utils.ts";
import { usePageQuery } from "@/features/page/queries/page-query.ts";
import { usePublicSpacePageQuery } from "@/features/public-space/queries/public-space-query.ts";
import { useSharePageQuery } from "@/features/share/queries/share-query.ts";
import { extractPageSlugId } from "@/lib";
import classes from "./mention.module.css";

export default function MentionView(props: NodeViewProps) {
  const { node } = props;
  const { label, entityType, entityId, slugId, anchorId } = node.attrs;
  const isPageMention = entityType === "page";
  const { spaceSlug, pageSlug } = useParams();
  const { shareId } = useParams();
  const navigate = useNavigate();

  const location = useLocation();
  const isShareRoute = location.pathname.startsWith("/share");
  const isPublicSpaceRoute = location.pathname.startsWith("/docs/");

  const {
    data: page,
    isLoading,
    isError,
  } = usePageQuery({
    pageId:
      isPageMention && !isShareRoute && !isPublicSpaceRoute ? slugId : null,
  });

  const { data: sharedPage } = useSharePageQuery({
    pageId: isPageMention && isShareRoute ? slugId : undefined,
  });

  // Without the slugId guard the request resolves to the space home, which
  // would render a mention pointing at the wrong page.
  const { data: publicPageData } = usePublicSpacePageQuery({
    contentless: true,
    pageSlugId: slugId,
    spaceSlug:
      isPageMention && isPublicSpaceRoute && slugId ? spaceSlug : undefined,
  });

  const currentPageSlugId = extractPageSlugId(pageSlug);
  const isSamePage = currentPageSlugId === slugId;

  const handleClick = (e: React.MouseEvent) => {
    if (isSamePage && anchorId) {
      e.preventDefault();
      const element = document.querySelector(`[id="${anchorId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        navigate(`#${anchorId}`, { replace: true });
      }
    }
  };

  const sharePageTitle = sharedPage?.page?.title || label;

  const shareSlugUrl = buildSharedPageUrl({
    anchorId,
    pageSlugId: slugId,
    pageTitle: sharePageTitle,
    shareId,
  });

  return (
    <NodeViewWrapper data-drag-handle style={{ display: "inline" }}>
      {entityType === "user" && (
        <Text className={classes.userMention} component="span">
          @{label}
        </Text>
      )}

      {isPageMention && isShareRoute && (
        <Anchor
          className={classes.pageMentionLink}
          component={Link}
          fw={500}
          onClick={handleClick}
          to={shareSlugUrl}
          underline="never"
        >
          <ActionIcon
            color="gray"
            component="span"
            size={18}
            style={{ verticalAlign: "text-bottom" }}
            variant="transparent"
          >
            <IconFileDescription size={18} />
          </ActionIcon>
          <span className={classes.pageMentionText}>{sharePageTitle}</span>
        </Anchor>
      )}

      {isPageMention && isPublicSpaceRoute && publicPageData?.page && (
        <Anchor
          className={classes.pageMentionLink}
          component={Link}
          fw={500}
          onClick={handleClick}
          to={buildPublicSpaceUrl({
            anchorId,
            pageSlugId: slugId,
            pageTitle: publicPageData.page.title || label,
            spaceSlug: publicPageData.space?.slug ?? spaceSlug,
          })}
          underline="never"
        >
          <ActionIcon
            color="gray"
            component="span"
            size={18}
            style={{ verticalAlign: "text-bottom" }}
            variant="transparent"
          >
            <IconFileDescription size={18} />
          </ActionIcon>
          <span className={classes.pageMentionText}>
            {publicPageData.page.title || label}
          </span>
        </Anchor>
      )}

      {/* No public URL: the /p/ resolver redirects members to the page and
          funnels anonymous visitors through login first. New tab, so the
          redirect chain never rewrites the docs tab's history. */}
      {isPageMention && isPublicSpaceRoute && !publicPageData?.page && (
        <Anchor
          className={classes.pageMentionLink}
          fw={500}
          href={buildPageUrl(undefined, slugId, label, anchorId)}
          rel="noopener noreferrer"
          target="_blank"
          underline="never"
        >
          <ActionIcon
            color="gray"
            component="span"
            size={18}
            style={{ verticalAlign: "text-bottom" }}
            variant="transparent"
          >
            <IconFileDescription size={18} />
          </ActionIcon>
          <span className={classes.pageMentionText}>{label}</span>
        </Anchor>
      )}

      {isPageMention && !isShareRoute && !isPublicSpaceRoute && isError && (
        <Anchor
          className={classes.pageMentionLink}
          component={Link}
          fw={500}
          onClick={handleClick}
          to={buildPageUrl(spaceSlug, slugId, label, anchorId)}
          underline="never"
        >
          <ActionIcon
            color="gray"
            component="span"
            size={18}
            style={{ verticalAlign: "text-bottom" }}
            variant="transparent"
          >
            <IconFileDescription size={18} />
          </ActionIcon>
          <span className={classes.pageMentionText}>{label}</span>
        </Anchor>
      )}

      {isPageMention && !isShareRoute && !isPublicSpaceRoute && !isError && (
        <Anchor
          className={classes.pageMentionLink}
          component={Link}
          fw={500}
          onClick={handleClick}
          to={buildPageUrl(
            page?.space?.slug || spaceSlug,
            slugId,
            page?.title || label,
            anchorId
          )}
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

          <span className={classes.pageMentionText}>
            {page?.title || label}
          </span>
        </Anchor>
      )}
    </NodeViewWrapper>
  );
}
