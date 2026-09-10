import { LinkExtension, Mention } from "@docmost/editor-ext";
import { Popover } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowUp,
  IconAt,
  IconFile,
  IconFileText,
  IconPaperclip,
  IconPhoto,
  IconPlayerStopFilled,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CharacterCount } from "@tiptap/extensions";
import { EditorContent, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import mentionRenderItems from "@/features/editor/components/mention/mention-suggestion";
import MentionView from "@/features/editor/components/mention/mention-view";
import EmojiCommand from "@/features/editor/extensions/emoji-command";
import { uploadChatFile } from "../services/ai-chat-service";
import classes from "../styles/chat-input.module.css";
import type { ChatAttachment, PageMention } from "../types/ai-chat.types";

type PendingAttachment = ChatAttachment & { uploading: boolean };

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"];
const ACCEPTED_FILE_TYPES = ".pdf,.docx,.txt,.csv,.md,.png,.jpg,.jpeg,.webp";
// Kept in sync with MAX_ATTACHMENTS_PER_MESSAGE in apps/server/src/ee/ai-chat/ai-chat-limits.ts
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

type Props = {
  isStreaming: boolean;
  onSend: (
    content: string,
    mentions: PageMention[],
    attachments: ChatAttachment[]
  ) => void;
  onStop: () => void;
  placeholder?: string;
  autofocus?: boolean;
  contextPages?: PageMention[];
  onRemoveContextPage?: (pageId: string) => void;
  variant?: "card" | "flat";
  showDisclaimer?: boolean;
  chatId?: string;
};

export type ChatInputHandle = {
  prefill: (text: string) => void;
};

function extractMentions(json: any): PageMention[] {
  const mentions: PageMention[] = [];
  const seen = new Set<string>();

  function walk(node: any) {
    if (
      node.type === "mention" &&
      node.attrs?.entityType === "page" &&
      node.attrs?.entityId &&
      !seen.has(node.attrs.entityId)
    ) {
      seen.add(node.attrs.entityId);
      mentions.push({
        id: node.attrs.entityId,
        slugId: node.attrs.slugId || "",
        title: node.attrs.label || "",
      });
    }
    if (node.content) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }

  walk(json);
  return mentions;
}

function editorJsonToText(json: any): string {
  let text = "";

  function walk(node: any) {
    if (node.type === "text") {
      text += node.text || "";
    } else if (node.type === "mention") {
      text += `@${node.attrs?.label || ""}`;
    } else if (node.type === "paragraph") {
      if (text.length > 0) {
        text += "\n";
      }
      if (node.content) {
        for (const child of node.content) {
          walk(child);
        }
      }
      return;
    }
    if (node.content) {
      for (const child of node.content) {
        walk(child);
      }
    }
  }

  walk(json);
  return text;
}

const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput(
  {
    isStreaming,
    onSend,
    onStop,
    placeholder,
    autofocus = true,
    contextPages,
    onRemoveContextPage,
    variant = "card",
    showDisclaimer = true,
    chatId,
  }: Props,
  ref
) {
  const chatIdRef = useRef(chatId);
  chatIdRef.current = chatId;
  const { t } = useTranslation();
  const [isEmpty, setIsEmpty] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingAttachment[]
  >([]);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const plusMenuId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) {
        return;
      }

      const room = MAX_ATTACHMENTS_PER_MESSAGE - pendingAttachments.length;
      if (room <= 0) {
        notifications.show({
          color: "yellow",
          message: t("You can attach up to {{max}} files per message.", {
            max: MAX_ATTACHMENTS_PER_MESSAGE,
          }),
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const incoming = Array.from(files);
      const accepted = incoming.slice(0, room);

      if (incoming.length > accepted.length) {
        notifications.show({
          color: "yellow",
          message: t(
            "Only the first {{n}} file(s) were added (max {{max}} per message).",
            { max: MAX_ATTACHMENTS_PER_MESSAGE, n: accepted.length }
          ),
        });
      }

      for (const file of accepted) {
        const tempId = `uploading-${Date.now()}-${Math.random()}`;
        const ext = file.name.split(".").pop()?.toLowerCase() || "";

        const placeholder: PendingAttachment = {
          fileExt: ext,
          fileName: file.name,
          fileSize: file.size,
          id: tempId,
          mimeType: file.type,
          uploading: true,
        };

        setPendingAttachments((prev) => [...prev, placeholder]);

        try {
          const uploaded = await uploadChatFile(file, chatIdRef.current);
          setPendingAttachments((prev) =>
            prev.map((a) =>
              a.id === tempId ? { ...uploaded, uploading: false } : a
            )
          );
        } catch {
          setPendingAttachments((prev) => prev.filter((a) => a.id !== tempId));
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [pendingAttachments.length, t]
  );

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!editor || editor.isDestroyed || isStreaming) {
      return;
    }
    const json = editor.getJSON();
    const text = editorJsonToText(json).trim();
    const readyAttachments = pendingAttachments.filter((a) => !a.uploading);
    if (!text && readyAttachments.length === 0) {
      return;
    }

    const mentions = extractMentions(json);
    onSendRef.current(text, mentions, readyAttachments);
    editor.commands.clearContent();
    editor.commands.focus();
    setPendingAttachments([]);
  }, [isStreaming, pendingAttachments]);

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  const editor = useEditor({
    autofocus: autofocus ? "end" : false,
    content: "",
    editable: true,
    editorProps: {
      attributes: {
        "aria-label":
          placeholder || t("Ask anything... Use @ to mention pages"),
        "aria-multiline": "true",
        role: "textbox",
      },
      handleDOMEvents: {
        keydown: (_view, event) => {
          if (
            [
              "ArrowUp",
              "ArrowDown",
              "ArrowLeft",
              "ArrowRight",
              "Enter",
            ].includes(event.key)
          ) {
            const emojiCommand = document.querySelector("#emoji-command");
            const mentionPopup = document.querySelector("#mention");
            if (emojiCommand || mentionPopup) {
              return true;
            }
          }

          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmitRef.current();
            return true;
          }
        },
      },
    },
    extensions: [
      StarterKit.configure({
        dropcursor: false,
        gapcursor: false,
        link: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || t("Ask anything... Use @ to mention pages"),
      }),
      CharacterCount.configure({
        limit: 50_000,
      }),
      LinkExtension,
      EmojiCommand,
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          allowSpaces: true,
          items: () => [],
          // @ts-expect-error
          render: mentionRenderItems,
        },
      }).extend({
        addNodeView() {
          this.editor.isInitialized = true;
          return ReactNodeViewRenderer(MentionView);
        },
      }),
    ],
    immediatelyRender: true,
    onUpdate: ({ editor: e }) => {
      setIsEmpty(!e.getText().trim());
    },
    shouldRerenderOnTransaction: false,
    textDirection: "auto",
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed && autofocus) {
      editor.commands.focus();
    }
  }, [editor]);

  useImperativeHandle(
    ref,
    () => ({
      prefill: (text: string) => {
        if (!editor || editor.isDestroyed) {
          return;
        }
        editor.commands.clearContent();
        editor.commands.insertContent(text);
        editor.commands.focus();
      },
    }),
    [editor]
  );

  const hasContent =
    !isEmpty ||
    pendingAttachments.some((a) => !a.uploading) ||
    (contextPages?.length ?? 0) > 0;

  const wrapperClass =
    variant === "flat" ? classes.inputWrapperFlat : classes.inputWrapper;

  return (
    <>
      <div className={wrapperClass} data-chat-input>
        <input
          accept={ACCEPTED_FILE_TYPES}
          aria-label={t("Add files")}
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          ref={fileInputRef}
          style={{ display: "none" }}
          tabIndex={-1}
          type="file"
        />

        {((contextPages?.length ?? 0) > 0 || pendingAttachments.length > 0) && (
          <div className={classes.attachmentChips}>
            {contextPages?.map((page) => (
              <div className={classes.attachmentChip} key={page.id}>
                <IconFileText size={14} />
                <span className={classes.attachmentChipName}>
                  {page.title || "Untitled"}
                </span>
                {onRemoveContextPage && (
                  <button
                    aria-label={`Remove ${page.title}`}
                    className={classes.attachmentChipRemove}
                    onClick={() => onRemoveContextPage(page.id)}
                    type="button"
                  >
                    <IconX size={12} />
                  </button>
                )}
              </div>
            ))}
            {pendingAttachments.map((attachment) => (
              <div
                className={`${classes.attachmentChip} ${attachment.uploading ? classes.attachmentChipUploading : ""}`}
                key={attachment.id}
              >
                {IMAGE_EXTENSIONS.includes(attachment.fileExt) ? (
                  <IconPhoto size={14} />
                ) : (
                  <IconFile size={14} />
                )}
                <span className={classes.attachmentChipName}>
                  {attachment.fileName}
                </span>
                {!attachment.uploading && (
                  <button
                    aria-label={`Remove ${attachment.fileName}`}
                    className={classes.attachmentChipRemove}
                    onClick={() => removeAttachment(attachment.id)}
                    type="button"
                  >
                    <IconX size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <EditorContent className={classes.editorContent} editor={editor} />
        <div className={classes.actions}>
          <Popover
            onChange={setPlusMenuOpen}
            opened={plusMenuOpen}
            position="top-start"
            returnFocus
            shadow="md"
            trapFocus
            width={220}
            withRoles={false}
          >
            <Popover.Target>
              <button
                aria-controls={plusMenuOpen ? plusMenuId : undefined}
                aria-expanded={plusMenuOpen}
                aria-haspopup="menu"
                aria-label="Add content"
                className={classes.plusButton}
                onClick={() => setPlusMenuOpen((o) => !o)}
                type="button"
              >
                <IconPlus size={14} />
              </button>
            </Popover.Target>
            <Popover.Dropdown id={plusMenuId} p={4} role="menu">
              <button
                className={classes.plusMenuItem}
                disabled={
                  pendingAttachments.length >= MAX_ATTACHMENTS_PER_MESSAGE
                }
                onClick={() => {
                  fileInputRef.current?.click();
                  setPlusMenuOpen(false);
                }}
                role="menuitem"
                title={
                  pendingAttachments.length >= MAX_ATTACHMENTS_PER_MESSAGE
                    ? t("Max {{max}} files per message", {
                        max: MAX_ATTACHMENTS_PER_MESSAGE,
                      })
                    : undefined
                }
                type="button"
              >
                <IconPaperclip className={classes.plusMenuIcon} size={16} />
                {t("Add files")}
              </button>
              <button
                className={classes.plusMenuItem}
                onClick={() => {
                  editor?.commands.insertContent("@");
                  editor?.commands.focus();
                  setPlusMenuOpen(false);
                }}
                role="menuitem"
                type="button"
              >
                <IconAt className={classes.plusMenuIcon} size={16} />
                {t("Mention a page")}
              </button>
            </Popover.Dropdown>
          </Popover>

          <div style={{ flex: 1 }} />

          {isStreaming ? (
            <button
              aria-label="Stop generation"
              className={classes.stopButton}
              onClick={onStop}
              type="button"
            >
              <IconPlayerStopFilled size={14} />
            </button>
          ) : (
            <button
              aria-label="Send message"
              className={classes.sendButton}
              disabled={!hasContent}
              onClick={handleSubmit}
              type="button"
            >
              <IconArrowUp size={16} stroke={2.5} />
            </button>
          )}
        </div>
      </div>
      {showDisclaimer && (
        <div className={classes.disclaimer}>
          {t("AI-generated content may not be accurate.")}
        </div>
      )}
    </>
  );
});

export default ChatInput;
