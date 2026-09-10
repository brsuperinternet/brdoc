import "@fontsource-variable/inter";
import "@/styles/public-typography.css";
import { Skeleton } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { Error404 } from "@/components/ui/error-404.tsx";
import { MAIN_CONTENT_ID, SkipToMain } from "@/components/ui/skip-to-main.tsx";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import { buildPublicSpaceUrl } from "@/features/page/page.utils.ts";
import styles from "@/features/public-space/components/docs/docs-hub.module.css";
import { useAuthenticatedUser } from "@/features/public-space/hooks/use-authenticated-user.ts";
import { usePublicSpaceDirectoryQuery } from "@/features/public-space/queries/public-space-query.ts";
import { getAvatarUrl } from "@/lib/config.ts";

const TILE_COLORS = [
  "#1f9d55",
  "#2b4bd6",
  "#7c3aed",
  "#0e7490",
  "#d9480f",
  "#b42318",
  "#a16207",
  "#475569",
  "#be185d",
  "#0f766e",
  "#4338ca",
  "#65a30d",
];

function getInitials(name: string) {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function PublicSpaceDirectoryPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = usePublicSpaceDirectoryQuery();
  const { data: currentUser } = useAuthenticatedUser();
  const isMobile = useMediaQuery("(max-width: 48em)");
  const [query, setQuery] = useState("");

  const spaces = useMemo(() => {
    const all = (data?.spaces ?? []).map((space, index) => ({
      ...space,
      color: TILE_COLORS[index % TILE_COLORS.length],
      initials: getInitials(space.name),
    }));
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return all;
    }
    return all.filter(
      (space) =>
        space.name.toLowerCase().includes(needle) ||
        space.description?.toLowerCase().includes(needle)
    );
  }, [data?.spaces, query]);

  if (isError) {
    if ([401, 403, 404].includes(error?.["response"]?.status)) {
      return <Error404 />;
    }
    return <div>{t("Error fetching page data.")}</div>;
  }

  const total = data?.spaces.length ?? 0;
  const title = t("Documentation");
  const searchLabel = isMobile ? t("Search...") : t("Search documentation...");

  return (
    <div className={clsx(styles.root, "public-typography")}>
      <SkipToMain />

      <DocumentTitle title={title} withAppName={false} />

      <div className={styles.topBar}>
        <div className={clsx(styles.container, styles.topBarInner)}>
          <Link className={styles.brand} to="/docs">
            <span aria-hidden className={styles.brandTile}>
              {title.charAt(0).toUpperCase()}
            </span>
            <span>{title}</span>
          </Link>

          <div className={styles.topActions}>
            {currentUser?.user ? (
              <Link className={styles.signIn} to="/home">
                {t("Open app")}
              </Link>
            ) : (
              <Link className={styles.signIn} to="/login">
                {t("Sign in")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <header className={styles.hero}>
        <div className={clsx(styles.container, styles.heroInner)}>
          <h1 className={styles.heading}>
            {t("Welcome to our documentation")}
          </h1>
          <p className={styles.subtitle}>
            {isMobile
              ? t("Guides, references and answers across all our spaces.")
              : t(
                  "Guides, references and answers across all our published spaces."
                )}
          </p>

          <form
            className={styles.search}
            onSubmit={(event) => event.preventDefault()}
            role="search"
          >
            <input
              aria-label={searchLabel}
              className={styles.searchInput}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchLabel}
              type="search"
              value={query}
            />
            <button
              aria-label={t("Search")}
              className={styles.searchButton}
              type="submit"
            >
              <IconSearch aria-hidden size={isMobile ? 16 : 18} stroke={2.4} />
            </button>
          </form>
        </div>
      </header>

      <main className={styles.main} id={MAIN_CONTENT_ID} tabIndex={-1}>
        <div className={clsx(styles.container, styles.mainInner)}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t("Spaces")}</h2>
            {!isLoading && (
              <span className={styles.sectionCount}>
                {total === 1
                  ? t("1 published space")
                  : t("{{count}} published spaces", { count: total })}
              </span>
            )}
          </div>

          {isLoading && (
            <div aria-hidden className={styles.grid}>
              <Skeleton height={220} radius={14} />
              <Skeleton height={220} radius={14} />
              <Skeleton height={220} radius={14} />
              <Skeleton height={220} radius={14} />
            </div>
          )}

          {!isLoading && total === 0 && (
            <p className={styles.empty}>{t("No public spaces yet.")}</p>
          )}

          {!isLoading && total > 0 && spaces.length === 0 && (
            <p className={styles.empty}>{t("No spaces match your search.")}</p>
          )}

          {spaces.length > 0 && (
            <div className={styles.grid}>
              {spaces.map((space) => {
                const logoUrl = getAvatarUrl(
                  space.logo,
                  AvatarIconType.SPACE_ICON
                );
                return (
                  <Link
                    className={styles.card}
                    key={space.slug}
                    to={buildPublicSpaceUrl({ spaceSlug: space.slug })}
                  >
                    <span className={styles.cardHeader}>
                      <span
                        aria-hidden
                        className={styles.cardTile}
                        style={{ backgroundColor: space.color }}
                      >
                        {logoUrl ? (
                          <img alt="" src={logoUrl} />
                        ) : (
                          space.initials
                        )}
                      </span>
                      <span className={styles.cardName}>{space.name}</span>
                    </span>
                    {space.description && (
                      <span className={styles.cardDescription}>
                        {space.description}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {data && (
        <footer className={styles.footer}>
          <div className={clsx(styles.container, styles.footerInner)}>
            <div>
              Powered by{" "}
              <a
                className={styles.footerBranding}
                href="https://docmost.com?ref=public-space"
                rel="noreferrer"
                target="_blank"
              >
                Docmost
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
