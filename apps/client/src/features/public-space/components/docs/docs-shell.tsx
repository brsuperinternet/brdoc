import { ActionIcon, Drawer, Tooltip } from "@mantine/core";
import { IconList, IconMenu2 } from "@tabler/icons-react";
import clsx from "clsx";
import { useAtom } from "jotai";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MAIN_CONTENT_ID, SkipToMain } from "@/components/ui/skip-to-main.tsx";
import {
  docsMobileSidebarAtom,
  docsMobileTocAtom,
} from "@/features/public-space/atoms/public-space-atoms.ts";
import DocsCopyPage from "@/features/public-space/components/docs/docs-copy-page.tsx";
import DocsEditPage from "@/features/public-space/components/docs/docs-edit-page.tsx";
import DocsFooterBranding from "@/features/public-space/components/docs/docs-footer-branding.tsx";
import DocsSearchButton from "@/features/public-space/components/docs/docs-search-button.tsx";
import DocsSidebarTree from "@/features/public-space/components/docs/docs-sidebar-tree.tsx";
import {
  DocsSurface,
  DocsSurfaceProvider,
} from "@/features/public-space/components/docs/docs-surface-context.tsx";
import DocsThemeToggle from "@/features/public-space/components/docs/docs-theme-toggle.tsx";
import DocsToc from "@/features/public-space/components/docs/docs-toc.tsx";
import { SearchMobileControl } from "@/features/search/components/search-control.tsx";
import styles from "./docs.module.css";

const MemoizedDocsSidebarTree = React.memo(DocsSidebarTree);
const MANTINE_COLOR_SCHEME_ATTRIBUTE = "data-mantine-color-scheme";
const DOCS_PRINT_COLOR_SCHEME_ATTRIBUTE = "data-docs-print-color-scheme";

type DocsShellProps = {
  surface: DocsSurface;
  onSearchOpen?: () => void;
  searchSpotlight?: React.ReactNode;
  children: React.ReactNode;
};

export default function DocsShell({
  surface,
  onSearchOpen,
  searchSpotlight,
  children,
}: DocsShellProps) {
  const { t } = useTranslation();
  const { hasSidebar, siteName, homeUrl, showBranding, showEditPage } = surface;

  const [mobileSidebarOpen, setMobileSidebarOpen] = useAtom(
    docsMobileSidebarAtom
  );
  const [mobileTocOpen, setMobileTocOpen] = useAtom(docsMobileTocAtom);

  React.useEffect(() => {
    const root = document.documentElement;
    let previousColorScheme: string | null = null;
    let isPrinting = false;

    const restoreColorScheme = () => {
      if (!isPrinting) {
        return;
      }

      if (previousColorScheme === null) {
        root.removeAttribute(MANTINE_COLOR_SCHEME_ATTRIBUTE);
      } else {
        root.setAttribute(MANTINE_COLOR_SCHEME_ATTRIBUTE, previousColorScheme);
      }
      root.removeAttribute(DOCS_PRINT_COLOR_SCHEME_ATTRIBUTE);
      isPrinting = false;
    };

    const useLightPrintTheme = () => {
      if (isPrinting) {
        return;
      }

      previousColorScheme = root.getAttribute(MANTINE_COLOR_SCHEME_ATTRIBUTE);
      root.setAttribute(
        DOCS_PRINT_COLOR_SCHEME_ATTRIBUTE,
        previousColorScheme ?? "light"
      );
      root.setAttribute(MANTINE_COLOR_SCHEME_ATTRIBUTE, "light");
      isPrinting = true;
    };

    window.addEventListener("beforeprint", useLightPrintTheme);
    window.addEventListener("afterprint", restoreColorScheme);

    return () => {
      window.removeEventListener("beforeprint", useLightPrintTheme);
      window.removeEventListener("afterprint", restoreColorScheme);
      restoreColorScheme();
    };
  }, []);

  return (
    <DocsSurfaceProvider value={surface}>
      <div className={clsx(styles.root, "public-typography")}>
        <SkipToMain />

        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerLeft}>
              {hasSidebar && (
                <Tooltip label={t("Toggle sidebar")}>
                  <ActionIcon
                    aria-expanded={mobileSidebarOpen}
                    aria-label={t("Toggle sidebar")}
                    className={clsx(styles.headerAction, styles.sidebarToggle)}
                    onClick={() => setMobileSidebarOpen((value) => !value)}
                    size="md"
                    variant="subtle"
                  >
                    <IconMenu2 size={18} stroke={2} />
                  </ActionIcon>
                </Tooltip>
              )}

              {!hasSidebar && siteName && homeUrl && (
                <Link className={styles.headerSpaceName} to={homeUrl}>
                  {siteName}
                </Link>
              )}
            </div>

            <div className={styles.headerCenter}>
              {onSearchOpen && (
                <div className={styles.searchSlot}>
                  <DocsSearchButton onClick={onSearchOpen} />
                </div>
              )}
            </div>

            <div className={styles.headerRight}>
              {onSearchOpen && (
                <span className={styles.mobileOnly}>
                  <SearchMobileControl onSearch={onSearchOpen} />
                </span>
              )}

              <DocsThemeToggle />
            </div>
          </div>
        </header>

        <div className={styles.body}>
          <nav
            aria-hidden={!hasSidebar || undefined}
            aria-label={t("Pages")}
            className={styles.sidebar}
            data-hidden={!hasSidebar || undefined}
          >
            {hasSidebar && (
              <>
                {siteName && homeUrl && (
                  <>
                    <Link className={styles.sidebarTitle} to={homeUrl}>
                      {siteName}
                    </Link>
                    <div aria-hidden className={styles.sidebarDivider} />
                  </>
                )}
                <div className={styles.sidebarScroll}>
                  <MemoizedDocsSidebarTree />
                </div>
              </>
            )}
          </nav>

          <main className={styles.main} id={MAIN_CONTENT_ID} tabIndex={-1}>
            <div className={styles.article}>
              <div className={styles.articleActions}>
                <DocsCopyPage />
                <span className={styles.tocOverlayControl}>
                  <Tooltip label={t("Table of contents")} withArrow>
                    <ActionIcon
                      aria-label={t("Table of contents")}
                      className={styles.headerAction}
                      onClick={() => setMobileTocOpen(true)}
                      size="md"
                      variant="subtle"
                    >
                      <IconList size={18} stroke={2} />
                    </ActionIcon>
                  </Tooltip>
                </span>
              </div>
              {children}
              {showBranding && (
                <DocsFooterBranding refSource={surface.brandingRef} />
              )}
            </div>
          </main>

          <aside aria-label={t("On this page")} className={styles.toc}>
            <DocsToc />
            {showEditPage && <DocsEditPage />}
          </aside>
        </div>

        <Drawer
          onClose={() => setMobileSidebarOpen(false)}
          opened={mobileSidebarOpen}
          padding="sm"
          size={300}
          title={siteName}
        >
          <div className={styles.drawerTree}>
            {hasSidebar && <MemoizedDocsSidebarTree />}
          </div>
        </Drawer>

        <Drawer
          onClose={() => setMobileTocOpen(false)}
          opened={mobileTocOpen}
          padding="md"
          position="right"
          size={300}
        >
          <DocsToc />
          {showEditPage && <DocsEditPage />}
        </Drawer>

        {searchSpotlight}
      </div>
    </DocsSurfaceProvider>
  );
}
