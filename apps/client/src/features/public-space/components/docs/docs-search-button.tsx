import { IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { platformModifierLabel } from "@/lib";
import styles from "./docs.module.css";

type DocsSearchButtonProps = {
  onClick: () => void;
};

export default function DocsSearchButton({ onClick }: DocsSearchButtonProps) {
  const { t } = useTranslation();

  return (
    <button className={styles.searchButton} onClick={onClick} type="button">
      <IconSearch aria-hidden size={15} stroke={2} />
      <span className={styles.searchLabel}>{t("Search")}</span>
      <span aria-hidden className={styles.searchKbd}>
        {platformModifierLabel} K
      </span>
    </button>
  );
}
