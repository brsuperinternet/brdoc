import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";
import classes from "../styles/chat-message.module.css";
import type { AiChatToolCall } from "../types/ai-chat.types";

export const TOOL_LABELS: Record<string, string> = {
  create_page: "Created page",
  get_page: "Read page",
  list_spaces: "Listed spaces",
  search_pages: "Searched pages",
  update_page: "Updated page",
};

type Props = {
  toolCall: AiChatToolCall;
};

export default function ChatToolResult({ toolCall }: Props) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[toolCall.name] || toolCall.name;

  return (
    <div className={classes.toolStep}>
      <div
        className={classes.toolStepRow}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className={classes.toolStepBullet}>·</span>
        {expanded ? (
          <IconChevronDown size={12} />
        ) : (
          <IconChevronRight size={12} />
        )}
        <span>{label}</span>
      </div>
      {expanded && (
        <div className={classes.toolStepDetails}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(
              { args: toolCall.args, result: toolCall.result },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
