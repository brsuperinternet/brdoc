import {
  copyToClipboard,
  isEditorReady,
  sanitizeUrl,
} from "@docmost/editor-ext";
import {
  ActionIcon,
  Divider,
  Group,
  Popover,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCopy,
  IconExternalLink,
  IconFileDescription,
  IconLinkOff,
  IconPencil,
  IconWorld,
} from "@tabler/icons-react";
import { MarkViewContent, MarkViewProps } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LinkEditorPanel } from "@/features/editor/components/link/link-editor-panel.tsx";
import {
  buildPageUrl,
  buildPublicSpaceUrl,
  buildSharedPageUrl,
} from "@/features/page/page.utils.ts";
import { usePageQuery } from "@/features/page/queries/page-query.ts";
import { usePublicSpacePageQuery } from "@/features/public-space/queries/public-space-query.ts";
import { useSharePageQuery } from "@/features/share/queries/share-query.ts";
import { extractPageSlugId } from "@/lib";
import { INTERNAL_LINK_REGEX } from "@/lib/constants";
import { normalizeUrl } from "@/lib/utils";
import classes from "./link.module.css";

const parseInternalLink = (
  href: string,
  internalAttr?: boolean
): { isInternal: boolean; slugId: string | null; label: string } => {
  if (!href) {
    return { isInternal: !!internalAttr, label: "", slugId: null };
  }

  const match = INTERNAL_LINK_REGEX.exec(href);
  if (!match) {
    if (internalAttr) {
      return { isInternal: true, label: href, slugId: null };
    }
    return { isInternal: false, label: href, slugId: null };
  }

  const isExternal = match[2] && match[2] !== window.location.host;
  const slug = match[5];
  const slugId = extractPageSlugId(slug);
  const namePart = slug.split("-").slice(0, -1).join("-");

  return {
    isInternal: !isExternal,
    label: namePart || slug,
    slugId,
  };
};

export default function LinkView(props: MarkViewProps) {
  const { mark, editor } = props;
  const href = mark.attrs.href as string;
  const navigate = useNavigate();
  const location = useLocation();
  const { shareId, spaceSlug, pageSlug } = useParams();
  const { t } = useTranslation();
  const isShareRoute = location.pathname.startsWith("/share");
  const isPublicSpaceRoute = location.pathname.startsWith("/docs/");

  const [popoverState, setPopoverState] = useState<
    "closed" | "preview" | "edit"
  >("closed");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const lastOpenState = useRef<"preview" | "edit">("preview");
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isEditable = editor.isEditable;
  const {
    isInternal,
    slugId,
    label: linkLabel,
  } = parseInternalLink(href, mark.attrs.internal);

  const isPopoverVisible = popoverState !== "closed";
  const activeView = isPopoverVisible ? popoverState : lastOpenState.current;

  const { data: linkedPage } = usePageQuery({
    pageId:
      isPopoverVisible && slugId && !isShareRoute && !isPublicSpaceRoute
        ? slugId
        : null,
  });

  const { data: sharedPageData } = useSharePageQuery({
    pageId: isPopoverVisible && slugId && isShareRoute ? slugId : null,
  });

  // Resolved eagerly (not gated on the popover): an unresolvable target must
  // render as inert text rather than a link that dead-ends at /login.
  const { data: publicSpacePageData } = usePublicSpacePageQuery({
    contentless: true,
    pageSlugId: slugId,
    spaceSlug: isPublicSpaceRoute && slugId ? spaceSlug : undefined,
  });

  const isUnresolvedPublicLink =
    isPublicSpaceRoute && isInternal && !publicSpacePageData?.page && !slugId;

  let pageTitle = linkedPage?.title;
  if (isShareRoute) {
    pageTitle = sharedPageData?.page?.title;
  } else if (isPublicSpaceRoute) {
    pageTitle = publicSpacePageData?.page?.title;
  }

  const pendingTitleRef = useRef<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const getLinkPos = useCallback((): number | null => {
    if (!wrapperRef.current) {
      return null;
    }
    try {
      return editor.view.posAtDOM(wrapperRef.current, 0);
    } catch {
      return null;
    }
  }, [editor]);

  const handleUpdateLinkTitle = useCallback(
    (newTitle: string) => {
      if (!newTitle) {
        return;
      }

      const pos = getLinkPos();
      if (pos === null) {
        return;
      }

      const { state } = editor;
      const resolved = state.doc.resolve(pos);
      const node = resolved.nodeAfter;
      if (!node?.isText) {
        return;
      }

      const linkMark = node.marks.find(
        (m) => m.type.name === "link" && m.attrs.href === href
      );
      if (!linkMark || node.text === newTitle) {
        return;
      }

      const from = pos;
      const to = pos + node.nodeSize;
      const { tr } = state;
      tr.insertText(newTitle, from, to);
      tr.addMark(from, from + newTitle.length, linkMark);
      editor.view.dispatch(tr);
    },
    [editor, href, getLinkPos]
  );

  const handleEditLink = useCallback(
    (url: string, internal?: boolean) => {
      const normalizedUrl = internal ? url : normalizeUrl(url);

      const pos = getLinkPos();
      if (pos === null) {
        setPopoverState("closed");
        return;
      }

      const { state } = editor;
      const resolved = state.doc.resolve(pos);
      const node = resolved.nodeAfter;
      if (!node?.isText) {
        setPopoverState("closed");
        return;
      }

      const linkMark = node.marks.find(
        (m) => m.type.name === "link" && m.attrs.href === href
      );
      if (linkMark) {
        const from = pos;
        const to = pos + node.nodeSize;
        const { tr } = state;
        tr.removeMark(from, to, linkMark.type);
        tr.addMark(
          from,
          to,
          linkMark.type.create({ href: normalizedUrl, internal: !!internal })
        );
        editor.view.dispatch(tr);
      }

      setPopoverState("closed");
    },
    [editor, href, getLinkPos]
  );

  useEffect(() => {
    if (popoverState === "edit") {
      const text = wrapperRef.current?.querySelector("a")?.textContent || "";
      setLinkTitle(text);
      setLinkUrl(href);
      pendingTitleRef.current = null;
      requestAnimationFrame(() => titleInputRef.current?.focus());
    }
    if (popoverState === "closed") {
      if (pendingTitleRef.current !== null) {
        handleUpdateLinkTitle(pendingTitleRef.current);
        pendingTitleRef.current = null;
      }
      setShowSearch(false);
    }
  }, [popoverState, href, isInternal, handleUpdateLinkTitle]);

  useEffect(() => {
    if (popoverState !== "closed") {
      lastOpenState.current = popoverState;
    }
  }, [popoverState]);

  useEffect(() => {
    if (!isPopoverVisible) {
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setPopoverState("closed");
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopoverState("closed");
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [isPopoverVisible]);

  const handleNavigate = useCallback(() => {
    if (!href) {
      return;
    }

    if (isInternal) {
      let targetPath = href;
      let anchor = "";

      try {
        const url = new URL(href);
        targetPath = url.pathname;
        anchor = url.hash.slice(1);
      } catch {
        if (href.includes("#")) {
          [targetPath, anchor] = href.split("#");
        }
      }

      if (anchor) {
        const currentPageSlugId = extractPageSlugId(pageSlug);
        if (!slugId || currentPageSlugId === slugId) {
          const element =
            document.querySelector(`[id="${anchor}"]`) ||
            document.querySelector(`[data-id="${anchor}"]`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
            navigate(`${location.pathname}#${anchor}`, { replace: true });
            return;
          }
        }
      }

      if (isShareRoute && slugId) {
        const sharedUrl = buildSharedPageUrl({
          anchorId: anchor || undefined,
          pageSlugId: slugId,
          pageTitle,
          shareId,
        });
        navigate(sharedUrl);
      } else if (isPublicSpaceRoute) {
        if (slugId && publicSpacePageData?.page) {
          navigate(
            buildPublicSpaceUrl({
              anchorId: anchor || undefined,
              pageSlugId: slugId,
              pageTitle,
              // cross-space targets resolve to their own space's public URL
              spaceSlug: publicSpacePageData.space?.slug ?? spaceSlug,
            })
          );
        } else if (slugId) {
          // no public URL: the /p/ resolver redirects members straight to the
          // page and funnels anonymous visitors through login first; a new tab
          // keeps the docs tab's history intact through that redirect chain
          window.open(
            buildPageUrl(undefined, slugId, pageTitle, anchor || undefined),
            "_blank",
            "noopener,noreferrer"
          );
        }
      } else {
        navigate(anchor ? `${targetPath}#${anchor}` : targetPath);
      }
    } else {
      window.open(
        sanitizeUrl(normalizeUrl(href)),
        "_blank",
        "noopener,noreferrer"
      );
    }
  }, [
    href,
    navigate,
    location.pathname,
    isInternal,
    isShareRoute,
    isPublicSpaceRoute,
    slugId,
    shareId,
    spaceSlug,
    publicSpacePageData,
    pageTitle,
    pageSlug,
  ]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isEditable) {
        setPopoverState("preview");
      } else {
        handleNavigate();
      }
    },
    [handleNavigate, isEditable]
  );

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const fullUrl = sanitizeUrl(
        isInternal ? `${window.location.origin}${href}` : href
      );
      copyToClipboard(fullUrl);
      notifications.show({
        message: t("Link copied"),
      });
      setPopoverState("closed");
    },
    [href, isInternal, t]
  );

  const handleRemoveLink = useCallback(() => {
    if (isEditorReady(editor)) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setPopoverState("closed");
  }, [editor]);

  const internalHref = () => {
    if (isShareRoute && slugId) {
      return buildSharedPageUrl({ pageSlugId: slugId, pageTitle, shareId });
    }
    if (isPublicSpaceRoute && slugId && publicSpacePageData?.page) {
      return buildPublicSpaceUrl({ pageSlugId: slugId, pageTitle, spaceSlug });
    }
    return href;
  };

  const displayHref = sanitizeUrl(
    isInternal ? internalHref() : normalizeUrl(href)
  );

  const linkTitleInput = (
    <>
      <Text c="dimmed" fw={600} mb={4} mt="sm" size="xs">
        {t("Link title")}
      </Text>
      <TextInput
        classNames={{ input: classes.linkInput }}
        onBlur={() => {
          if (pendingTitleRef.current !== null) {
            handleUpdateLinkTitle(pendingTitleRef.current);
            pendingTitleRef.current = null;
          }
        }}
        onChange={(e) => {
          const val = e.currentTarget.value;
          setLinkTitle(val);
          pendingTitleRef.current = val;
          const anchor = wrapperRef.current?.querySelector("a");
          if (anchor && val) {
            const walker = document.createTreeWalker(
              anchor,
              NodeFilter.SHOW_TEXT
            );
            const textNode = walker.nextNode();
            if (textNode && isEditorReady(editor)) {
              const view = editor.view as any;
              view.domObserver.stop();
              textNode.nodeValue = val;
              view.domObserver.start();
            }
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleUpdateLinkTitle(linkTitle);
            pendingTitleRef.current = null;
            setPopoverState("closed");
          }
        }}
        ref={titleInputRef}
        size="sm"
        value={linkTitle}
      />
    </>
  );

  // Targets outside the published space have no public URL, so the label is
  // rendered as inert text instead of a link that dead-ends at /login.
  if (isUnresolvedPublicLink) {
    return (
      <span className={classes.linkWrapper} ref={wrapperRef}>
        <MarkViewContent />
      </span>
    );
  }

  return (
    <Popover
      closeOnClickOutside={false}
      opened={isPopoverVisible}
      position="bottom"
      shadow="md"
      trapFocus={false}
      width={activeView === "edit" ? 320 : undefined}
      withArrow
    >
      <Popover.Target>
        <span
          className={classes.linkWrapper}
          onClick={handleClick}
          ref={wrapperRef}
        >
          <a
            href={displayHref}
            onClick={(e) => e.preventDefault()}
            rel={isInternal ? undefined : "noopener noreferrer"}
            spellCheck={false}
            target={isInternal ? undefined : "_blank"}
          >
            <MarkViewContent />
          </a>
        </span>
      </Popover.Target>

      <Popover.Dropdown
        onMouseDown={(e) => e.stopPropagation()}
        p={activeView === "edit" ? "sm" : 6}
        ref={dropdownRef}
      >
        {activeView === "edit" ? (
          <>
            <Text c="dimmed" fw={600} mb={4} size="xs">
              {t("Page or URL")}
            </Text>

            {isInternal ? (
              showSearch ? (
                <LinkEditorPanel
                  onSetLink={handleEditLink}
                  onUnsetLink={handleRemoveLink}
                />
              ) : (
                <>
                  <UnstyledButton
                    className={classes.linkChip}
                    onClick={() => setShowSearch(true)}
                  >
                    <IconFileDescription
                      color="var(--mantine-color-dimmed)"
                      size={16}
                      stroke={1.5}
                      style={{ flexShrink: 0 }}
                    />
                    <Text fw={500} size="sm" truncate>
                      {pageTitle || linkTitle}
                    </Text>
                  </UnstyledButton>

                  {linkTitleInput}

                  <Divider my="xs" />

                  <UnstyledButton
                    className={classes.removeLink}
                    onClick={handleRemoveLink}
                  >
                    <Group gap={8}>
                      <IconLinkOff size={16} stroke={1.5} />
                      <Text size="sm">{t("Remove link")}</Text>
                    </Group>
                  </UnstyledButton>
                </>
              )
            ) : (
              <>
                <TextInput
                  classNames={{ input: classes.linkInput }}
                  leftSection={
                    <IconWorld
                      color="var(--mantine-color-dimmed)"
                      size={16}
                      stroke={1.5}
                    />
                  }
                  onBlur={() => {
                    if (linkUrl && linkUrl !== href) {
                      handleEditLink(linkUrl, false);
                    }
                  }}
                  onChange={(e) => setLinkUrl(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (linkUrl && linkUrl !== href) {
                        handleEditLink(linkUrl, false);
                      }
                    }
                  }}
                  size="sm"
                  value={linkUrl}
                />

                {linkTitleInput}

                <Divider my="xs" />

                <UnstyledButton
                  className={classes.removeLink}
                  onClick={handleRemoveLink}
                >
                  <Group gap={8}>
                    <IconLinkOff size={16} stroke={1.5} />
                    <Text size="sm">{t("Remove link")}</Text>
                  </Group>
                </UnstyledButton>
              </>
            )}
          </>
        ) : (
          <Group gap={4} wrap="nowrap">
            <Group
              component="a"
              gap={6}
              //@ts-expect-error
              href={displayHref}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                handleNavigate();
              }}
              rel={isInternal ? undefined : "noopener noreferrer"}
              style={{
                color: "inherit",
                cursor: "pointer",
                maxWidth: 250,
                textDecoration: "none",
                userSelect: "none",
              }}
              target={isInternal ? undefined : "_blank"}
              wrap="nowrap"
            >
              {isInternal ? (
                <IconFileDescription color="gray" size={18} />
              ) : (
                <IconExternalLink color="gray" size={18} />
              )}
              <Text fw={500} size="sm" truncate>
                {isInternal ? pageTitle || linkLabel : href}
              </Text>
            </Group>

            <Divider orientation="vertical" />

            <Tooltip label={t("Edit link")} withArrow withinPortal={false}>
              <ActionIcon
                color="gray"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSearch(false);
                  setPopoverState("edit");
                }}
                variant="subtle"
              >
                <IconPencil size={18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={t("Copy link")} withArrow withinPortal={false}>
              <ActionIcon
                color="gray"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopy(e);
                }}
                variant="subtle"
              >
                <IconCopy size={18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={t("Remove link")} withArrow withinPortal={false}>
              <ActionIcon
                color="gray"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveLink();
                }}
                variant="subtle"
              >
                <IconLinkOff size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
