import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { HomeAiPromptInitialState } from "@/features/home/components/home-ai-prompt";
import { useChatStream } from "../hooks/use-chat-stream";
import { useChatInfoQuery } from "../queries/ai-chat-query";
import classes from "../styles/ai-chat.module.css";
import ChatEmptyState from "./chat-empty-state";
import ChatInput from "./chat-input";
import ChatMessageList from "./chat-message-list";

export default function AiChatLayout() {
  const { chatId } = useParams<{ chatId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const chatInfoQuery = useChatInfoQuery(chatId);

  // If the URL points at a chat the user does not own, the info fetch 404s.
  // Bounce them back to /ai so they cannot interact with any chat UI (including
  // kicking off orphan uploads) tied to a chat they have no access to.
  useEffect(() => {
    if (chatId && chatInfoQuery.isError) {
      navigate("/ai", { replace: true });
    }
  }, [chatId, chatInfoQuery.isError, navigate]);
  const {
    messages,
    streamingContent,
    streamingToolCalls,
    isStreaming,
    error,
    sendMessage,
    stopGeneration,
    hydrateFromServer,
  } = useChatStream(chatId);

  const autoSentRef = useRef(false);

  useEffect(() => {
    if (chatInfoQuery.data?.messages) {
      hydrateFromServer(chatInfoQuery.data.messages);
    }
  }, [chatInfoQuery.data, hydrateFromServer]);

  useEffect(() => {
    if (autoSentRef.current || chatId) {
      return;
    }
    const state = location.state as HomeAiPromptInitialState | null;
    if (!(state?.initialContent || state?.initialAttachments?.length)) {
      return;
    }

    autoSentRef.current = true;
    sendMessage(
      state.initialContent ?? "",
      state.initialMentions ?? [],
      state.initialAttachments ?? []
    );
    navigate(location.pathname, { replace: true, state: null });
  }, [chatId, location, navigate, sendMessage]);

  const hasMessages = messages.length > 0 || isStreaming || !!chatId;

  // While the redirect effect is running (or if the user is still on this
  // component for any reason) never render the chat UI for a forbidden chat.
  if (chatId && chatInfoQuery.isError) {
    return null;
  }

  return (
    <div className={classes.main}>
      {hasMessages ? (
        <>
          <ChatMessageList
            isStreaming={isStreaming}
            messages={messages}
            streamingContent={streamingContent}
            streamingToolCalls={streamingToolCalls}
          />
          {error && (
            <div
              style={{
                color: "var(--mantine-color-red-6)",
                fontSize: "var(--mantine-font-size-sm)",
                padding: "var(--mantine-spacing-sm) var(--mantine-spacing-lg)",
              }}
            >
              {error}
            </div>
          )}
          <div className={classes.inputArea}>
            <ChatInput
              chatId={chatId}
              isStreaming={isStreaming}
              onSend={sendMessage}
              onStop={stopGeneration}
            />
          </div>
        </>
      ) : (
        <ChatEmptyState
          isStreaming={isStreaming}
          onSend={sendMessage}
          onStop={stopGeneration}
        />
      )}
    </div>
  );
}
