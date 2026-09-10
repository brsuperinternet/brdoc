import { Loader, ScrollArea, Text, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useChatsQuery, useSearchChatsQuery } from "../queries/ai-chat-query";
import classes from "../styles/aside-chat-panel.module.css";

type Props = {
  activeChatId: string | undefined;
  onSelect: (chatId: string) => void;
};

export default function AsideChatHistory({ activeChatId, onSelect }: Props) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);

  const chatsQuery = useChatsQuery();
  const searchQuery = useSearchChatsQuery(debouncedSearch);

  const isSearching = debouncedSearch.length > 0;
  const chats = isSearching
    ? (searchQuery.data ?? [])
    : (chatsQuery.data?.pages.flatMap((p) => p.items) ?? []);
  const isLoading = isSearching ? searchQuery.isLoading : chatsQuery.isLoading;

  return (
    <div>
      <TextInput
        leftSection={<IconSearch size={14} />}
        mb="xs"
        onChange={(e) => setSearchValue(e.currentTarget.value)}
        placeholder={t("Search chats...")}
        size="xs"
        value={searchValue}
      />

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
          <Loader size="sm" />
        </div>
      ) : chats.length === 0 ? (
        <Text c="dimmed" py="md" size="sm" ta="center">
          {isSearching ? t("No chats found") : t("No chat history")}
        </Text>
      ) : (
        <ScrollArea.Autosize mah={300} scrollbars="y">
          <div className={classes.historyList}>
            {chats.map((chat) => (
              <div
                className={classes.historyItem}
                data-active={chat.id === activeChatId || undefined}
                key={chat.id}
                onClick={() => onSelect(chat.id)}
              >
                <span className={classes.historyItemTitle}>
                  {chat.title || t("Untitled chat")}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea.Autosize>
      )}
    </div>
  );
}
