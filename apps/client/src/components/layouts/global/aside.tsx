import {
  ActionIcon,
  Box,
  Group,
  ScrollArea,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useAtom, useAtomValue } from "jotai";
import { lazy, ReactNode, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { asideStateAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms.ts";
import { ASIDE_PANEL_ID } from "@/hooks/use-toggle-aside.tsx";

const CommentListWithTabs = lazy(
  () => import("@/features/comment/components/comment-list-with-tabs.tsx")
);
const TableOfContents = lazy(() =>
  import(
    "@/features/editor/components/table-of-contents/table-of-contents.tsx"
  ).then((m) => ({ default: m.TableOfContents }))
);
const AsideChatPanel = lazy(
  () => import("@/ee/ai-chat/components/aside-chat-panel")
);
const PageDetailsAside = lazy(() =>
  import("@/features/page-details/components/page-details-aside.tsx").then(
    (m) => ({ default: m.PageDetailsAside })
  )
);

export default function Aside() {
  const [{ tab, isAsideOpen }, setAsideState] = useAtom(asideStateAtom);
  const { t } = useTranslation();
  const pageEditor = useAtomValue(pageEditorAtom);
  const closeAside = () => setAsideState((s) => ({ ...s, isAsideOpen: false }));

  useEffect(() => {
    if (!isAsideOpen) {
      return;
    }
    document.getElementById(ASIDE_PANEL_ID)?.focus();
  }, [isAsideOpen, tab]);

  let title: string;
  let component: ReactNode;

  switch (tab) {
    case "comments":
      component = <CommentListWithTabs />;
      title = "Comments";
      break;
    case "toc":
      component = <TableOfContents editor={pageEditor} />;
      title = "Table of contents";
      break;
    case "chat":
      component = <AsideChatPanel />;
      title = "AI Chat";
      break;
    case "details":
      component = <PageDetailsAside />;
      title = "Details";
      break;
    default:
      component = null;
      title = null;
  }

  return (
    <Box
      p="md"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {component && (
        <>
          {tab !== "chat" && (
            <Group justify="space-between" mb="md" wrap="nowrap">
              <Title fw={500} order={2} size="h6">
                {t(title)}
              </Title>
              <Tooltip label={t("Close")} withArrow>
                <ActionIcon
                  aria-label={t("Close")}
                  color="gray"
                  onClick={closeAside}
                  variant="subtle"
                >
                  <IconX size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}

          <Suspense fallback={null}>
            {tab === "comments" || tab === "chat" ? (
              component
            ) : (
              <ScrollArea
                scrollbarSize={5}
                style={{ height: "85vh" }}
                type="scroll"
              >
                <div style={{ paddingBottom: "200px" }}>{component}</div>
              </ScrollArea>
            )}
          </Suspense>
        </>
      )}
    </Box>
  );
}
