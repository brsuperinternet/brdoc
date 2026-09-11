import { AppShell, Container } from "@mantine/core";
import { useAtom } from "jotai";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { AppHeader } from "@/components/layouts/global/app-header.tsx";
import Aside from "@/components/layouts/global/aside.tsx";
import GlobalSidebar from "@/components/layouts/global/global-sidebar.tsx";
import {
  asideStateAtom,
  desktopSidebarAtom,
  mobileSidebarAtom,
  sidebarWidthAtom,
} from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import SettingsSidebar from "@/components/settings/settings-sidebar.tsx";
import { MAIN_CONTENT_ID, SkipToMain } from "@/components/ui/skip-to-main.tsx";
import { SpaceSidebar } from "@/features/space/components/sidebar/space-sidebar.tsx";
import { ASIDE_PANEL_ID } from "@/hooks/use-toggle-aside.tsx";
import classes from "./app-shell.module.css";

export default function GlobalAppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  const [mobileOpened] = useAtom(mobileSidebarAtom);

  const [desktopOpened] = useAtom(desktopSidebarAtom);
  const [{ isAsideOpen, tab: asideTab }] = useAtom(asideStateAtom);
  const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const startResizing = React.useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing) {
        const newWidth =
          mouseMoveEvent.clientX -
          sidebarRef.current.getBoundingClientRect().left;
        if (newWidth < 220) {
          setSidebarWidth(220);
          return;
        }
        if (newWidth > 600) {
          setSidebarWidth(600);
          return;
        }
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => {
    //https://codesandbox.io/p/sandbox/kz9de
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const location = useLocation();
  const isSettingsRoute = location.pathname.startsWith("/settings");
  const isSpaceRoute = location.pathname.startsWith("/s/");
  const isPageRoute = location.pathname.includes("/p/");
  const showGlobalSidebar = !(isSpaceRoute || isSettingsRoute);

  return (
    <>
      <SkipToMain />
      <AppShell
        aside={
          isPageRoute && {
            breakpoint: "sm",
            collapsed: { desktop: !isAsideOpen, mobile: !isAsideOpen },
            width: 350,
          }
        }
        header={{ height: 45 }}
        navbar={{
          breakpoint: "sm",
          collapsed: {
            desktop: !desktopOpened,
            mobile: !mobileOpened,
          },
          width: isSpaceRoute ? sidebarWidth : 300,
        }}
        padding="md"
      >
        <AppShell.Header className={classes.header} px="md">
          <AppHeader />
        </AppShell.Header>
        <AppShell.Navbar
          aria-label={
            isSpaceRoute
              ? t("Space navigation")
              : isSettingsRoute
                ? t("Settings navigation")
                : t("Main navigation")
          }
          className={classes.navbar}
          ref={sidebarRef}
          withBorder={false}
        >
          {isSpaceRoute && (
            <div className={classes.resizeHandle} onMouseDown={startResizing} />
          )}
          {isSpaceRoute && <SpaceSidebar />}
          {isSettingsRoute && <SettingsSidebar />}
          {showGlobalSidebar && <GlobalSidebar />}
        </AppShell.Navbar>
        <AppShell.Main id={MAIN_CONTENT_ID} tabIndex={-1}>
          {isSettingsRoute ? (
            <Container pb={80} size={900}>
              {children}
            </Container>
          ) : (
            children
          )}
        </AppShell.Main>

        {isPageRoute && (
          <AppShell.Aside
            aria-label={
              asideTab === "comments"
                ? t("Comments")
                : asideTab === "toc"
                  ? t("Table of contents")
                  : asideTab === "chat"
                    ? t("AI Chat")
                    : asideTab === "details"
                      ? t("Details")
                      : undefined
            }
            className={classes.aside}
            id={ASIDE_PANEL_ID}
            p="md"
            tabIndex={-1}
            withBorder={false}
          >
            <Aside />
          </AppShell.Aside>
        )}
      </AppShell>
    </>
  );
}
