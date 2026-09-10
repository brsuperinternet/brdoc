import {
  ActionIcon,
  Center,
  Loader,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { IconMessageCircle2, IconPlus, IconSearch } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useChatsQuery,
  useDeleteChatMutation,
  useSearchChatsQuery,
  useUpdateChatTitleMutation,
} from "../queries/ai-chat-query";
import classes from "../styles/chat-sidebar.module.css";
import { groupChatsByAge } from "../utils/group-chats-by-age";
import AiChatSidebarItem from "./ai-chat-sidebar-item";

export default function AiChatSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const chatsQuery = useChatsQuery();
  const searchQuery = useSearchChatsQuery(debouncedSearch);
  const deleteMutation = useDeleteChatMutation();
  const renameMutation = useUpdateChatTitleMutation();

  const chats = useMemo(() => {
    if (debouncedSearch) {
      return searchQuery.data || [];
    }
    return chatsQuery.data?.pages.flatMap((p) => p.items) || [];
  }, [debouncedSearch, searchQuery.data, chatsQuery.data]);

  const groupedChats = useMemo(() => groupChatsByAge(chats, t), [chats, t]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const { hasNextPage, fetchNextPage, isFetchingNextPage } = chatsQuery;
  const isSearching = Boolean(debouncedSearch);

  useEffect(() => {
    if (isSearching) {
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isSearching, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNewChat = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }
      event.preventDefault();
      navigate("/ai");
    },
    [navigate]
  );

  const handleDelete = useCallback(
    (id: string, title: string | null) => {
      modals.openConfirmModal({
        centered: true,
        children: (
          <Text size="sm">
            {t(
              "Are you sure you want to delete '{{title}}'? This action cannot be undone.",
              {
                title: title || t("Untitled"),
              }
            )}
          </Text>
        ),
        confirmProps: { color: "red" },
        labels: { cancel: t("Cancel"), confirm: t("Delete") },
        onConfirm: () => {
          deleteMutation.mutate(id, {
            onSuccess: () => {
              if (chatId === id) {
                navigate("/ai");
              }
            },
          });
        },
        title: t("Delete chat"),
      });
    },
    [deleteMutation, chatId, navigate, t]
  );

  const handleRename = useCallback(
    (chatId: string, title: string) => {
      renameMutation.mutate({ chatId, title });
    },
    [renameMutation]
  );

  const isLoading = chatsQuery.isLoading || searchQuery.isLoading;

  return (
    <div className={classes.sidebar}>
      <div className={classes.header}>
        <h2 className={classes.title}>{t("AI Chat")}</h2>
        <Tooltip label={t("New chat")} openDelay={250} withArrow>
          <ActionIcon
            aria-label={t("New chat")}
            color="gray"
            component={Link}
            onClick={handleNewChat}
            to="/ai"
            variant="subtle"
          >
            <IconPlus size={18} />
          </ActionIcon>
        </Tooltip>
      </div>

      <TextInput
        aria-label={t("Search chats")}
        className={classes.searchInput}
        leftSection={<IconSearch size={14} />}
        onChange={(e) => setSearch(e.currentTarget.value)}
        placeholder={t("Search chats...")}
        size="xs"
        value={search}
      />

      <div className={classes.chatList}>
        {isLoading && <Loader mt="md" mx="auto" size="xs" />}
        {!isLoading && chats.length === 0 && (
          <div className={classes.chatListEmpty}>
            <IconMessageCircle2
              className={classes.chatListEmptyIcon}
              size={28}
              stroke={1.5}
            />
            <div className={classes.chatListEmptyTitle}>
              {isSearching ? t("No chats found") : t("No conversations yet")}
            </div>
            <div className={classes.chatListEmptyHint}>
              {isSearching
                ? t("Try a different search term.")
                : t("Start a new chat to see it here.")}
            </div>
          </div>
        )}
        {isSearching
          ? chats.map((chat) => (
              <AiChatSidebarItem
                chat={chat}
                isActive={chat.id === chatId}
                key={chat.id}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))
          : groupedChats.map((group) => (
              <div className={classes.chatGroup} key={group.key}>
                <h3 className={classes.chatGroupLabel}>{group.label}</h3>
                {group.chats.map((chat) => (
                  <AiChatSidebarItem
                    chat={chat}
                    isActive={chat.id === chatId}
                    key={chat.id}
                    onDelete={handleDelete}
                    onRename={handleRename}
                  />
                ))}
              </div>
            ))}
        {!isSearching && (
          <>
            <div ref={sentinelRef} style={{ height: 1 }} />
            {isFetchingNextPage && (
              <Center py="xs">
                <Loader size="xs" />
              </Center>
            )}
          </>
        )}
      </div>
    </div>
  );
}
