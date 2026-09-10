import { markdownToHtml } from "@docmost/editor-ext";
import { IconFile, IconLoader2, IconPhoto } from "@tabler/icons-react";
import DOMPurify from "dompurify";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import CopyTextButton from "@/components/common/copy.tsx";
import classes from "../styles/chat-message.module.css";
import type { AiChatMessage, AiChatToolCall } from "../types/ai-chat.types";
import ChatToolGroup from "./chat-tool-group";

const PAGE_PATH_RE = /\/s\/[^/?#]+\/p\/[^/?#]+/;

const chatSanitizer = DOMPurify();
chatSanitizer.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName !== "A") {
    return;
  }
  const href = node.getAttribute("href") || "";

  // Recover the canonical /s/{slug}/p/{slugId} path if the model wrapped it
  // in a fabricated host (https://s/..., https://yoursite.com/s/..., //s/...).
  const m = href.match(PAGE_PATH_RE);
  if (m) {
    node.setAttribute("href", m[0]);
    node.removeAttribute("target");
    node.removeAttribute("rel");
    return;
  }

  if (href.startsWith("http://") || href.startsWith("https://")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"];

type Props = {
  message: AiChatMessage;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingToolCalls?: AiChatToolCall[];
};

export default function ChatMessage({
  message,
  isStreaming,
  streamingContent,
  streamingToolCalls,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (href && (href.startsWith("/s/") || href.startsWith("/p/"))) {
        e.preventDefault();
        navigate(href);
      }
    },
    [navigate]
  );

  if (message.role === "tool") {
    return null;
  }

  const isUser = message.role === "user";
  const content = isStreaming ? streamingContent : message.content;
  const toolCalls = isStreaming ? streamingToolCalls : message.toolCalls;

  if (isUser) {
    const displayContent = (content || "").replace(
      /\n\n<referenced_pages>[\s\S]*<\/referenced_pages>$/,
      ""
    );
    const attachments =
      (message.metadata?.attachments as {
        id: string;
        fileName: string;
        fileExt: string;
      }[]) || [];

    return (
      <div
        aria-label={t("You said:")}
        className={classes.userMessage}
        role="article"
      >
        <div className={classes.userBubble}>
          {attachments.length > 0 && (
            <div className={classes.messageAttachments}>
              {attachments.map((a) => (
                <span className={classes.messageAttachmentChip} key={a.id}>
                  {IMAGE_EXTENSIONS.includes(a.fileExt) ? (
                    <IconPhoto size={13} />
                  ) : (
                    <IconFile size={13} />
                  )}
                  {a.fileName}
                </span>
              ))}
            </div>
          )}
          {displayContent}
        </div>
      </div>
    );
  }

  // Only label the article when there's something meaningful to announce.
  // Tool-only assistant turns (no text) shouldn't announce "Assistant said:" with empty content.
  const hasAnnouncableContent = Boolean(content);

  return (
    <div
      aria-label={hasAnnouncableContent ? t("Assistant said:") : undefined}
      className={classes.assistantMessage}
      role="article"
    >
      <div className={classes.messageContent}>
        {toolCalls && toolCalls.length > 0 && (
          <ChatToolGroup isStreaming={isStreaming} toolCalls={toolCalls} />
        )}
        {content && (
          <div
            dangerouslySetInnerHTML={{
              __html: chatSanitizer.sanitize(
                markdownToHtml(content) as string,
                { ADD_ATTR: ["target", "rel"] }
              ),
            }}
            onClick={handleContentClick}
          />
        )}
        {isStreaming && (
          <>
            {!content && (
              <span className={classes.processingIndicator}>
                <IconLoader2 className={classes.processingSpinner} size={16} />
                Thinking
              </span>
            )}
            <span className={classes.streamingCursor} />
          </>
        )}
      </div>
      {!isStreaming && message.content && (
        <div className={classes.messageActions}>
          <CopyTextButton
            label={t("Copy assistant response")}
            text={message?.content}
          />
        </div>
      )}
    </div>
  );
}
