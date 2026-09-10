import {
  IconEdit,
  IconFilePlus,
  IconFileText,
  IconSearch,
  IconSparkles,
} from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import classes from "../styles/ai-chat.module.css";
import type { ChatAttachment, PageMention } from "../types/ai-chat.types";
import ChatInput, { ChatInputHandle } from "./chat-input";

type Suggestion = {
  icon: React.ReactNode;
  text: string;
  prompt: string;
  write?: boolean;
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: <IconSearch size={16} />,
    prompt: "Search for pages about ",
    text: "Search across all pages",
  },
  {
    icon: <IconFilePlus size={16} />,
    prompt: "Create a new page titled ",
    text: "Create a new page",
    write: true,
  },
  {
    icon: <IconFileText size={16} />,
    prompt: "Summarize the page @",
    text: "Summarize a page",
  },
  {
    icon: <IconEdit size={16} />,
    prompt: "Update the page @",
    text: "Update page content",
    write: true,
  },
];

type Props = {
  isStreaming: boolean;
  onSend: (
    content: string,
    mentions: PageMention[],
    attachments: ChatAttachment[]
  ) => void;
  onStop: () => void;
};

export default function ChatEmptyState({ isStreaming, onSend, onStop }: Props) {
  const { t } = useTranslation();
  const workspace = useAtomValue(workspaceAtom);
  const writesDisabled = workspace?.settings?.ai?.chatReadOnly === true;

  const inputRef = useRef<ChatInputHandle>(null);

  const handleSuggestionClick = (prompt: string) => {
    inputRef.current?.prefill(prompt);
  };

  return (
    <div className={classes.emptyState}>
      <IconSparkles className={classes.emptyStateIcon} size={48} stroke={1.5} />
      <div className={classes.emptyStateBrand}>{t("Docmost AI")}</div>
      <h1 className={classes.emptyStateTitle}>
        {t("What can I help you with?")}
      </h1>

      <div className={classes.emptyStateInput}>
        <ChatInput
          autofocus
          isStreaming={isStreaming}
          onSend={onSend}
          onStop={onStop}
          placeholder={t("Ask anything... Use @ to mention pages")}
          ref={inputRef}
        />
      </div>

      <div className={classes.suggestionsSection}>
        <h2 className={classes.suggestionsLabel}>{t("Get started")}</h2>
        <div className={classes.suggestionsGrid}>
          {SUGGESTIONS.filter((s) => !(writesDisabled && s.write)).map((s) => (
            <button
              className={classes.suggestionCard}
              key={s.text}
              onClick={() => handleSuggestionClick(s.prompt)}
              type="button"
            >
              <span className={classes.suggestionIcon}>{s.icon}</span>
              <span className={classes.suggestionText}>{s.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
