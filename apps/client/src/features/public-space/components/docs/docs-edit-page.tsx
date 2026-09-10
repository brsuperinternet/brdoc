import { IconPencil } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { useAuthenticatedUser } from "@/features/public-space/hooks/use-authenticated-user.ts";
import { useDocsCurrentPage } from "@/features/public-space/hooks/use-docs-current-page.ts";
import styles from "./docs.module.css";

export default function DocsEditPage() {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const page = useDocsCurrentPage();

  const { data: currentUser } = useAuthenticatedUser();

  if (!(currentUser?.user && page)) {
    return null;
  }

  return (
    <Link
      className={styles.editPageLink}
      rel="noopener"
      target="_blank"
      to={buildPageUrl(spaceSlug, page.slugId, page.name)}
    >
      <IconPencil aria-hidden size={14} stroke={1.8} />
      {t("Edit page")}
    </Link>
  );
}
