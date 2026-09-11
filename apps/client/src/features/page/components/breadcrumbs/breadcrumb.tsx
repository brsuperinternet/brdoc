import {
  ActionIcon,
  Anchor,
  Breadcrumbs,
  Button,
  Popover,
  Text,
  Tooltip,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconCornerDownRightDouble, IconDots } from "@tabler/icons-react";
import type { TFunction } from "i18next";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { buildPageUrl, getPageTitle } from "@/features/page/page.utils.ts";
import { usePageQuery } from "@/features/page/queries/page-query.ts";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom.ts";
import { SpaceTreeNode } from "@/features/page/tree/types.ts";
import { findBreadcrumbPath } from "@/features/page/tree/utils";
import { extractPageSlugId } from "@/lib";
import classes from "./breadcrumb.module.css";

function getTitle(node: SpaceTreeNode, t: TFunction) {
  const name = getPageTitle(node.name, node.isBase, t);
  if (node.icon) {
    return `${node.icon} ${name}`;
  }
  return name;
}

export default function Breadcrumb() {
  const { t } = useTranslation();
  const treeData = useAtomValue(treeDataAtom);
  const [breadcrumbNodes, setBreadcrumbNodes] = useState<
    SpaceTreeNode[] | null
  >(null);
  const { pageSlug, spaceSlug } = useParams();
  const { data: currentPage } = usePageQuery({
    pageId: extractPageSlugId(pageSlug),
  });
  const isMobile = useMediaQuery("(max-width: 48em)");

  useEffect(() => {
    if (treeData?.length > 0 && currentPage) {
      const breadcrumb = findBreadcrumbPath(treeData, currentPage.id);
      setBreadcrumbNodes(breadcrumb || null);
    }
  }, [currentPage?.id, treeData]);

  const HiddenNodesTooltipContent = () =>
    breadcrumbNodes?.slice(1, -1).map((node) => (
      <Button.Group key={node.id} orientation="vertical">
        <Button
          component={Link}
          justify="start"
          style={{ border: "none" }}
          to={buildPageUrl(spaceSlug, node.slugId, node.name)}
          variant="default"
        >
          <Text className={classes.truncatedText} fz={"sm"}>
            {getTitle(node, t)}
          </Text>
        </Button>
      </Button.Group>
    ));

  const MobileHiddenNodesTooltipContent = () =>
    breadcrumbNodes?.map((node) => (
      <Button.Group key={node.id} orientation="vertical">
        <Button
          component={Link}
          justify="start"
          style={{ border: "none" }}
          to={buildPageUrl(spaceSlug, node.slugId, node.name)}
          variant="default"
        >
          <Text className={classes.truncatedText} fz={"sm"}>
            {getTitle(node, t)}
          </Text>
        </Button>
      </Button.Group>
    ));

  const renderAnchor = useCallback(
    (node: SpaceTreeNode, isCurrent = false) => (
      <Tooltip key={node.id} label={getPageTitle(node.name, node.isBase, t)}>
        <Anchor
          aria-current={isCurrent ? "page" : undefined}
          className={classes.truncatedText}
          component={Link}
          fz="sm"
          key={node.id}
          to={buildPageUrl(spaceSlug, node.slugId, node.name)}
          underline="never"
        >
          {getTitle(node, t)}
        </Anchor>
      </Tooltip>
    ),
    [spaceSlug, t]
  );

  const getBreadcrumbItems = () => {
    if (!breadcrumbNodes) {
      return [];
    }

    if (breadcrumbNodes.length > 3) {
      const firstNode = breadcrumbNodes[0];
      //const secondLastNode = breadcrumbNodes[breadcrumbNodes.length - 2];
      const lastNode = breadcrumbNodes.at(-1);

      return [
        renderAnchor(firstNode),
        <Popover
          key="hidden-nodes"
          position="bottom"
          shadow="xl"
          width={250}
          withArrow
        >
          <Popover.Target>
            <ActionIcon
              aria-label={t("Show hidden breadcrumbs")}
              color="gray"
              variant="transparent"
            >
              <IconDots size={20} stroke={2} />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown>
            <HiddenNodesTooltipContent />
          </Popover.Dropdown>
        </Popover>,
        //renderAnchor(secondLastNode),
        renderAnchor(lastNode, true),
      ];
    }

    return breadcrumbNodes.map((node, i) =>
      renderAnchor(node, i === breadcrumbNodes.length - 1)
    );
  };

  const getMobileBreadcrumbItems = () => {
    if (!breadcrumbNodes) {
      return [];
    }

    if (breadcrumbNodes.length > 0) {
      return [
        <Popover
          key="mobile-hidden-nodes"
          position="bottom"
          shadow="xl"
          width={250}
          withArrow
        >
          <Popover.Target>
            <Tooltip label={t("Breadcrumbs")}>
              <ActionIcon
                aria-label={t("Breadcrumbs")}
                color="gray"
                variant="transparent"
              >
                <IconCornerDownRightDouble size={20} stroke={2} />
              </ActionIcon>
            </Tooltip>
          </Popover.Target>
          <Popover.Dropdown>
            <MobileHiddenNodesTooltipContent />
          </Popover.Dropdown>
        </Popover>,
      ];
    }

    return breadcrumbNodes.map((node, i) =>
      renderAnchor(node, i === breadcrumbNodes.length - 1)
    );
  };

  return (
    <nav aria-label={t("Breadcrumb")} className={classes.breadcrumbDiv}>
      {breadcrumbNodes && (
        <Breadcrumbs className={classes.breadcrumbs}>
          {isMobile ? getMobileBreadcrumbItems() : getBreadcrumbItems()}
        </Breadcrumbs>
      )}
    </nav>
  );
}
