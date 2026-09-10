import clsx from "clsx";
import styles from "./docs.module.css";

export default function DocsFooterBranding({
  className,
  refSource = "public-space",
}: {
  className?: string;
  refSource?: string;
}) {
  return (
    <footer className={clsx(styles.footer, className)}>
      <a
        className={styles.footerBranding}
        href={`https://docmost.com?ref=${refSource}`}
        rel="noreferrer"
        target="_blank"
      >
        Powered by Docmost
      </a>
    </footer>
  );
}
