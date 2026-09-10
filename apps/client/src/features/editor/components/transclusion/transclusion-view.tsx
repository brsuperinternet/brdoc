import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconCopy,
  IconDots,
  IconLinkOff,
  IconTrash,
} from "@tabler/icons-react";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import SyncBlockReferencesDropdown from "@/features/transclusion/components/sync-block-references-dropdown";
import classes from "./transclusion.module.css";

export default function TransclusionView(props: NodeViewProps) {
  const { editor, node, deleteNode } = props;
  const { t } = useTranslation();
  const [openMenus, setOpenMenus] = useState(0);
  const trackOpen = (open: boolean) =>
    setOpenMenus((n) => Math.max(0, n + (open ? 1 : -1)));

  const isEditable = editor.isEditable;
  // @ts-expect-error - editor.storage.pageId is set by the host editor (page-editor.tsx onCreate)
  const sourcePageId: string | undefined = editor.storage?.pageId;
  const transclusionId: string | null = node.attrs.id ?? null;

  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (!(sourcePageId && transclusionId)) {
      return;
    }
    const html = `<div data-type="transclusionReference" data-source-page-id="${sourcePageId}" data-transclusion-id="${transclusionId}"></div>`;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html], { type: "text/plain" }),
        }),
      ]);
    } catch {
      // Fallback for browsers without ClipboardItem write support
      try {
        await navigator.clipboard.writeText(html);
      } catch {
        return;
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    notifications.show({
      message: t("Copied. Paste on any page to embed this synced block."),
    });
  };

  const handleUnsync = () => {
    editor.chain().focus().unsyncTransclusionSource().run();
  };

  return (
    <NodeViewWrapper
      className={classes.transclusionWrap}
      data-editable={isEditable ? "true" : "false"}
      data-id={transclusionId ?? undefined}
      data-menu-open={openMenus > 0 ? "true" : "false"}
    >
      {isEditable && (
        <div
          className={classes.transclusionControls}
          contentEditable={false}
          onMouseDown={(e) => e.preventDefault()}
        >
          {sourcePageId && transclusionId && (
            <SyncBlockReferencesDropdown
              currentPageId={sourcePageId}
              mode="source"
              onOpenChange={trackOpen}
              sourcePageId={sourcePageId}
              transclusionId={transclusionId}
            />
          )}

          <span className={classes.controlsDivider} />

          <Tooltip label={copied ? t("Copied") : t("Copy synced block")}>
            <ActionIcon
              color={copied ? "teal" : "gray"}
              disabled={!(sourcePageId && transclusionId)}
              onClick={handleCopy}
              size="sm"
              variant="subtle"
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>

          <Menu onChange={trackOpen} position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon color="gray" size="sm" variant="subtle">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconLinkOff size={14} />}
                onClick={handleUnsync}
              >
                {t("Unsync")}
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => deleteNode()}
              >
                {t("Delete synced block")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )}

      <NodeViewContent />
    </NodeViewWrapper>
  );
}
