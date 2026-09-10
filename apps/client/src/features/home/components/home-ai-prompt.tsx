import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ChatInput from "@/ee/ai-chat/components/chat-input";
import type {
  ChatAttachment,
  PageMention,
} from "@/ee/ai-chat/types/ai-chat.types";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import classes from "./home-ai-prompt.module.css";

export type HomeAiPromptInitialState = {
  initialContent: string;
  initialMentions: PageMention[];
  initialAttachments: ChatAttachment[];
};

export default function HomeAiPrompt() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workspace = useAtomValue(workspaceAtom);

  const aiChatEnabled = workspace?.settings?.ai?.chat === true;
  if (!aiChatEnabled) {
    return null;
  }

  const handleSend = (
    content: string,
    mentions: PageMention[],
    attachments: ChatAttachment[]
  ) => {
    if (!content.trim() && attachments.length === 0) {
      return;
    }
    const state: HomeAiPromptInitialState = {
      initialAttachments: attachments,
      initialContent: content,
      initialMentions: mentions,
    };
    navigate("/ai", { state });
  };

  return (
    <div className={classes.wrapper}>
      <h1 className={classes.heading}>
        {t("Welcome to {{name}}", { name: workspace?.name ?? "Docmost" })}
      </h1>
      <div className={classes.subtitle}>
        {t("Ask anything or search your workspace")}
      </div>

      <div className={classes.inputContainer}>
        <ChatInput
          autofocus={false}
          isStreaming={false}
          onSend={handleSend}
          onStop={() => {}}
          placeholder={t("Ask anything... Use @ to mention pages")}
        />
      </div>
    </div>
  );
}
