import { ActionIcon, Menu, TextInput } from "@mantine/core";
import { IconDots, IconEdit, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import classes from "../styles/chat-sidebar.module.css";
import type { AiChat } from "../types/ai-chat.types";

type Props = {
  chat: AiChat;
  isActive: boolean;
  onDelete: (chatId: string, title: string | null) => void;
  onRename: (chatId: string, title: string) => void;
};

function formatChatDate(
  isoString: string | Date,
  locale: string | undefined
): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const ts = date.getTime();
  const sameYear = date.getFullYear() === now.getFullYear();

  if (ts >= startOfToday) {
    return date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (sameYear) {
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    });
  }

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AiChatSidebarItem({
  chat,
  isActive,
  onDelete,
  onRename,
}: Props) {
  const { t, i18n } = useTranslation();
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const formattedDate = useMemo(
    () => formatChatDate(chat.updatedAt, i18n.language),
    [chat.updatedAt, i18n.language]
  );

  const chatTitle = chat.title || t("Untitled chat");

  useEffect(() => {
    if (renaming) {
      // Wait for the input to be mounted before selecting.
      const id = window.setTimeout(() => inputRef.current?.select(), 0);
      return () => window.clearTimeout(id);
    }
  }, [renaming]);

  const startRename = useCallback(() => {
    setRenameValue(chat.title || "");
    setRenaming(true);
  }, [chat.title]);

  const submitRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== chat.title) {
      onRename(chat.id, trimmed);
    }
    setRenaming(false);
  }, [renameValue, chat.id, chat.title, onRename]);

  if (renaming) {
    return (
      <div className={classes.chatItem} data-active={isActive || undefined}>
        <TextInput
          classNames={{ input: classes.chatItemRenameInput }}
          onBlur={submitRename}
          onChange={(e) => setRenameValue(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitRename();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setRenaming(false);
            }
          }}
          placeholder={t("Chat name")}
          ref={inputRef}
          size="xs"
          style={{ flex: 1 }}
          value={renameValue}
          variant="unstyled"
        />
      </div>
    );
  }

  return (
    <Link
      className={classes.chatItem}
      data-active={isActive || undefined}
      to={`/ai/chat/${chat.id}`}
    >
      <span className={classes.chatItemTitle}>{chatTitle}</span>
      <span className={classes.chatItemDate}>{formattedDate}</span>
      <div className={classes.chatItemActions}>
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon
              aria-label={t("Chat menu for {{title}}", { title: chatTitle })}
              color="gray"
              onClick={(e) => e.preventDefault()}
              size="xs"
              variant="subtle"
            >
              <IconDots size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startRename();
              }}
            >
              {t("Rename")}
            </Menu.Item>
            <Menu.Item
              color="red"
              leftSection={<IconTrash size={14} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(chat.id, chat.title);
              }}
            >
              {t("Delete")}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </Link>
  );
}
