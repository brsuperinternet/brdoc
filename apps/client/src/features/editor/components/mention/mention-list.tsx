import {
  ActionIcon,
  Divider,
  Group,
  Paper,
  ScrollArea,
  Text,
  UnstyledButton,
  VisuallyHidden,
} from "@mantine/core";
import { IconFileDescription, IconPlus } from "@tabler/icons-react";
import clsx from "clsx";
import { useAtom } from "jotai";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { v7 as uuid7 } from "uuid";
import { AutoTooltipText } from "@/components/ui/auto-tooltip-text.tsx";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import {
  MentionListProps,
  MentionSuggestionItem,
} from "@/features/editor/components/mention/mention.type.ts";
import { getPageTitle } from "@/features/page/page.utils";
import {
  useCreatePageMutation,
  usePageQuery,
} from "@/features/page/queries/page-query";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom";
import { treeModel } from "@/features/page/tree/model/tree-model";
import { SpaceTreeNode } from "@/features/page/tree/types";
import { IPage } from "@/features/page/types/page.types";
import { useSearchSuggestionsQuery } from "@/features/search/queries/search-query.ts";
import { useSpaceQuery } from "@/features/space/queries/space-query.ts";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";
import { useQueryEmit } from "@/features/websocket/use-query-emit";
import { extractPageSlugId } from "@/lib";
import classes from "./mention.module.css";

const MentionList = forwardRef<any, MentionListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [countAnnouncement, setCountAnnouncement] = useState("");
  const [selectionAnnouncement, setSelectionAnnouncement] = useState("");
  const { pageSlug, spaceSlug } = useParams();
  const { data: page } = usePageQuery({ pageId: extractPageSlugId(pageSlug) });
  const { data: space } = useSpaceQuery(spaceSlug);
  const [currentUser] = useAtom(currentUserAtom);
  const [renderItems, setRenderItems] = useState<MentionSuggestionItem[]>([]);
  const { t } = useTranslation();
  const [data, setData] = useAtom(treeDataAtom);
  const createPageMutation = useCreatePageMutation();
  const emit = useQueryEmit();
  const isInCommentContext = props.isInCommentContext ?? false;

  const { data: suggestion, isLoading } = useSearchSuggestionsQuery({
    includePages: true,
    includeUsers: true,
    limit: props.query ? 10 : 5,
    preload: true,
    query: props.query,
    spaceId: space?.id,
  });

  const createPageItem = (label: string): MentionSuggestionItem => ({
    entityId: null,
    entityType: "page",
    icon: null,
    id: null,
    label,
    slugId: null,
  });

  useEffect(() => {
    if (suggestion && !isLoading) {
      let items: MentionSuggestionItem[] = [];

      if (suggestion?.users?.length > 0) {
        items.push({ entityType: "header", label: t("People") });

        items = items.concat(
          suggestion.users.map((user) => ({
            avatarUrl: user.avatarUrl,
            entityId: user.id,
            entityType: "user",
            id: uuid7(),
            label: user.name,
          }))
        );
      }

      if (suggestion?.pages?.length > 0) {
        items.push({ entityType: "header", label: t("Pages") });
        items = items.concat(
          suggestion.pages.map((page) => ({
            entityId: page.id,
            entityType: "page",
            icon: page.icon,
            id: uuid7(),
            label: getPageTitle(page.title, page.isBase, t),
            slugId: page.slugId,
            spaceName: page.space?.name,
            spaceSlug: page.space?.slug,
          }))
        );
      }
      if (!isInCommentContext && props.query) {
        items.push(createPageItem(props.query));
      }

      setRenderItems(items);
      // update editor storage
      //@ts-expect-error
      props.editor.storage.mentionItems = items;
    }
  }, [suggestion, isLoading]);

  const selectItem = useCallback(
    (index: number) => {
      const item = renderItems?.[index];
      if (item) {
        if (item.entityType === "user") {
          props.command({
            creatorId: currentUser?.user.id,
            entityId: item.entityId,
            entityType: "user",
            id: item.id,
            label: item.label,
          });
        }
        if (item.entityType === "page" && item.id !== null) {
          props.command({
            creatorId: currentUser?.user.id,
            entityId: item.entityId,
            entityType: "page",
            id: item.id,
            label: item.label || t("Untitled"),
            slugId: item.slugId,
          });
        }
        if (item.entityType === "page" && item.id === null) {
          createPage(item.label);
        }
      }
    },
    [renderItems]
  );

  const upHandler = () => {
    if (!renderItems.length) {
      return;
    }

    let newIndex = selectedIndex;

    do {
      newIndex = (newIndex + renderItems.length - 1) % renderItems.length;
    } while (renderItems[newIndex].entityType === "header");
    setSelectedIndex(newIndex);
  };

  const downHandler = () => {
    if (!renderItems.length) {
      return;
    }
    let newIndex = selectedIndex;
    do {
      newIndex = (newIndex + 1) % renderItems.length;
    } while (renderItems[newIndex].entityType === "header");
    setSelectedIndex(newIndex);
  };

  const enterHandler = () => {
    if (!renderItems.length) {
      return;
    }
    if (renderItems[selectedIndex]?.entityType !== "header") {
      selectItem(selectedIndex);
    }
  };

  useEffect(() => {
    setSelectedIndex(1);
  }, [suggestion]);

  const selectableCount = useMemo(
    () => renderItems.filter((item) => item.entityType !== "header").length,
    [renderItems]
  );

  useEffect(() => {
    if (renderItems.length === 0) {
      setCountAnnouncement(t("No results"));
      return;
    }
    setCountAnnouncement(
      t("{{count}} result available", { count: selectableCount })
    );
  }, [renderItems.length, selectableCount, t]);

  useEffect(() => {
    const item = renderItems[selectedIndex];
    if (!item || item.entityType === "header") {
      setSelectionAnnouncement("");
      return;
    }
    if (item.entityType === "user") {
      setSelectionAnnouncement(`${t("People")}: ${item.label}`);
      return;
    }
    if (item.entityType === "page") {
      if (item.id === null) {
        setSelectionAnnouncement(`${t("Create page")}: ${item.label}`);
        return;
      }
      const pageLabel = item.label || t("Untitled");
      setSelectionAnnouncement(
        item.spaceName
          ? `${t("Pages")}: ${pageLabel}, ${item.spaceName}`
          : `${t("Pages")}: ${pageLabel}`
      );
    }
  }, [selectedIndex, renderItems, t]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        // don't trap the enter button if there are no items to render
        if (renderItems.length === 0) {
          return false;
        }
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  const createPage = async (title: string) => {
    const payload: { spaceId: string; parentPageId?: string; title: string } = {
      parentPageId: page.id || null,
      spaceId: space.id,
      title,
    };

    let createdPage: IPage;
    try {
      createdPage = await createPageMutation.mutateAsync(payload);
      const parentId = page.id || null;
      const newNode: SpaceTreeNode = {
        children: [],
        hasChildren: false,
        id: createdPage.id,
        name: createdPage.title,
        parentPageId: createdPage.parentPageId,
        position: createdPage.position,
        slugId: createdPage.slugId,
        spaceId: createdPage.spaceId,
      };

      const lastIndex = data.length;

      setData(treeModel.insert(data, parentId, newNode, lastIndex));

      props.command({
        creatorId: currentUser?.user.id,
        entityId: createdPage.id,
        entityType: "page",
        id: uuid7(),
        label: getPageTitle(createdPage.title, createdPage.isBase, t),
        slugId: createdPage.slugId,
      });

      setTimeout(() => {
        emit({
          operation: "addTreeNode",
          payload: {
            data: newNode,
            index: lastIndex,
            parentId,
          },
          spaceId: space.id,
        });
      }, 50);
    } catch (err) {
      throw new Error("Failed to create page");
    }
  };

  useEffect(() => {
    viewportRef.current
      ?.querySelector(`[data-item-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const popupWidth = isInCommentContext ? 280 : 320;

  if (renderItems.length === 0) {
    return (
      <Paper id="mention" py="xs" radius="md" shadow="md" withBorder>
        <VisuallyHidden aria-atomic="true" aria-live="polite" role="status">
          {countAnnouncement}
        </VisuallyHidden>
        <Text c="dimmed" px="sm" size="sm">
          {t("No results")}
        </Text>
      </Paper>
    );
  }

  const hasUsers = renderItems.some((item) => item.entityType === "user");
  const hasPages = renderItems.some(
    (item) => item.entityType === "page" && item.id !== null
  );
  const createPageItemData = renderItems.find(
    (item) => item.entityType === "page" && item.id === null
  );

  return (
    <Paper
      aria-activedescendant={`mention-option-${selectedIndex}`}
      aria-label={t("Mention suggestions")}
      id="mention"
      py={6}
      radius="md"
      role="listbox"
      shadow="md"
      withBorder
    >
      <VisuallyHidden aria-atomic="true" aria-live="polite" role="status">
        {countAnnouncement}
      </VisuallyHidden>
      <VisuallyHidden aria-atomic="true" aria-live="polite" role="status">
        {selectionAnnouncement}
      </VisuallyHidden>
      <ScrollArea.Autosize
        mah={350}
        overscrollBehavior={"contain"}
        scrollbarSize={6}
        scrollbars={"y"}
        styles={{ content: { minWidth: 0 } }}
        viewportRef={viewportRef}
        w={popupWidth}
      >
        {renderItems?.map((item, index) => {
          if (item.entityType === "header") {
            const isFirst = index === 0;
            return (
              <div key={`${item.label}-${index}`} role="presentation">
                {!isFirst && <Divider my={6} />}
                <Text
                  c="dimmed"
                  fw={500}
                  pb={4}
                  pt={isFirst ? 2 : 4}
                  px="sm"
                  size="xs"
                  style={{ userSelect: "none" }}
                  tt="uppercase"
                >
                  {item.label}
                </Text>
              </div>
            );
          }
          if (item.entityType === "user") {
            return (
              <UnstyledButton
                aria-selected={index === selectedIndex}
                className={clsx(classes.menuBtn, {
                  [classes.selectedItem]: index === selectedIndex,
                })}
                data-item-index={index}
                id={`mention-option-${index}`}
                key={index}
                onClick={() => selectItem(index)}
                px="sm"
                role="option"
              >
                <Group gap="sm">
                  <CustomAvatar
                    avatarUrl={item.avatarUrl}
                    name={item.label}
                    size={"sm"}
                  />

                  <div style={{ flex: 1 }}>
                    <AutoTooltipText fw={500} size="sm">
                      {item.label}
                    </AutoTooltipText>
                  </div>
                </Group>
              </UnstyledButton>
            );
          }
          if (item.entityType === "page" && item.id !== null) {
            return (
              <UnstyledButton
                aria-selected={index === selectedIndex}
                className={clsx(classes.menuBtn, {
                  [classes.selectedItem]: index === selectedIndex,
                })}
                data-item-index={index}
                id={`mention-option-${index}`}
                key={index}
                onClick={() => selectItem(index)}
                px="sm"
                role="option"
              >
                <Group gap="sm" wrap="nowrap">
                  <ActionIcon
                    aria-hidden="true"
                    color="gray"
                    component="div"
                    size="sm"
                    variant="subtle"
                  >
                    {item.icon || (
                      <IconFileDescription size={18} stroke={1.5} />
                    )}
                  </ActionIcon>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <AutoTooltipText fw={500} size="sm" truncate>
                      {item.label}
                    </AutoTooltipText>
                    {item.spaceName && (
                      <Text c="dimmed" size="xs" truncate>
                        {item.spaceName}
                      </Text>
                    )}
                  </div>
                </Group>
              </UnstyledButton>
            );
          }
          return null;
        })}

        {createPageItemData && !isInCommentContext && (
          <>
            {(hasUsers || hasPages) && <Divider my={6} />}
            <UnstyledButton
              aria-selected={
                renderItems.indexOf(createPageItemData) === selectedIndex
              }
              className={clsx(classes.menuBtn, {
                [classes.selectedItem]:
                  renderItems.indexOf(createPageItemData) === selectedIndex,
              })}
              data-item-index={renderItems.indexOf(createPageItemData)}
              id={`mention-option-${renderItems.indexOf(createPageItemData)}`}
              onClick={() =>
                selectItem(renderItems.indexOf(createPageItemData))
              }
              px="sm"
              role="option"
            >
              <Group gap="sm" wrap="nowrap">
                <ActionIcon
                  aria-hidden="true"
                  color="gray"
                  component="div"
                  size="sm"
                  variant="subtle"
                >
                  <IconPlus size={16} stroke={1.5} />
                </ActionIcon>

                <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                  <Text fw={500} size="sm" truncate>
                    {t("Create page")}: {createPageItemData.label}
                  </Text>
                </div>
              </Group>
            </UnstyledButton>
          </>
        )}
      </ScrollArea.Autosize>
    </Paper>
  );
});

export default MentionList;
