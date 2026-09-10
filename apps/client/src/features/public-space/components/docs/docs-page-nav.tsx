import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { useDocsSurface } from "@/features/public-space/components/docs/docs-surface-context.tsx";
import { flattenTreePreorder } from "@/features/public-space/utils/docs-tree.ts";
import { SharedPageTreeNode } from "@/features/share/utils.ts";
import { extractPageSlugId } from "@/lib";
import styles from "./docs.module.css";

export default function DocsPageNav() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();
  const { treeData, getNodeUrl } = useDocsSurface();

  const { prev, next } = useMemo(() => {
    if (!treeData?.length) {
      return {
        next: null as SharedPageTreeNode | null,
        prev: null as SharedPageTreeNode | null,
      };
    }
    const flat = flattenTreePreorder(treeData);
    const currentSlugId = pageSlug
      ? extractPageSlugId(pageSlug)
      : treeData[0]?.slugId;
    const index = flat.findIndex((node) => node.slugId === currentSlugId);
    return {
      next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : null,
      prev: index > 0 ? flat[index - 1] : null,
    };
  }, [treeData, pageSlug]);

  if (!(prev || next)) {
    return null;
  }

  return (
    <nav aria-label={t("Page navigation")} className={styles.pageNav}>
      {prev && (
        <Link
          className={styles.pageNavCard}
          data-direction="prev"
          to={getNodeUrl(prev)}
        >
          <span className={styles.pageNavLabel}>
            <IconArrowLeft aria-hidden size={13} stroke={2} />
            {t("Previous")}
          </span>
          <span className={styles.pageNavTitle}>
            {prev.name || t("untitled")}
          </span>
        </Link>
      )}
      {next && (
        <Link
          className={styles.pageNavCard}
          data-direction="next"
          to={getNodeUrl(next)}
        >
          <span className={styles.pageNavLabel}>
            {t("Next")}
            <IconArrowRight aria-hidden size={13} stroke={2} />
          </span>
          <span className={styles.pageNavTitle}>
            {next.name || t("untitled")}
          </span>
        </Link>
      )}
    </nav>
  );
}
