import { ActionIcon, Group, Loader, Paper, Text, Tooltip } from "@mantine/core";
import { useHover } from "@mantine/hooks";
import {
  IconDownload,
  IconFileTypePdf,
  IconPaperclip,
} from "@tabler/icons-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { formatBytes } from "@/lib";
import { getFileUrl } from "@/lib/config.ts";

export default function AttachmentView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { editor, node, getPos, selected } = props;
  const { url, name, size, mime, attachmentId, placeholder } = node.attrs;
  const { hovered, ref } = useHover();

  const isPdf =
    mime === "application/pdf" || name?.toLowerCase().endsWith(".pdf");

  const handleEmbedAsPdf = useCallback(() => {
    const pos = getPos();
    if (pos === undefined || !url) {
      return;
    }

    const nodeSize = node.nodeSize;

    editor
      .chain()
      .insertContentAt(
        { from: pos, to: pos + nodeSize },
        {
          attrs: {
            attachmentId,
            name,
            size,
            src: url,
          },
          type: "pdf",
        }
      )
      .run();
  }, [editor, getPos, node, url, name, attachmentId]);

  return (
    <NodeViewWrapper>
      <Paper data-drag-handle p="4px" ref={ref} withBorder>
        <Group
          gap="xl"
          h={25}
          justify="space-between"
          style={{ cursor: "pointer" }}
          wrap="nowrap"
        >
          <Group gap="sm" style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
            {!url && placeholder ? (
              <Loader size={20} style={{ flexShrink: 0 }} />
            ) : (
              <IconPaperclip size={20} style={{ flexShrink: 0 }} />
            )}

            <Text
              component="span"
              size="md"
              style={{ minWidth: 0 }}
              truncate="end"
            >
              {!url && placeholder ? t("Uploading {{name}}", { name }) : name}
            </Text>

            <Text
              c="dimmed"
              component="span"
              size="sm"
              style={{ flexShrink: 0 }}
            >
              {formatBytes(size)}
            </Text>
          </Group>

          {url && (selected || hovered) && (
            <Group gap={4} style={{ flexShrink: 0 }} wrap="nowrap">
              {isPdf && editor.isEditable && (
                <Tooltip
                  label={t("Embed as PDF")}
                  position="top"
                  withinPortal={false}
                >
                  <ActionIcon
                    aria-label={t("Embed as PDF")}
                    onClick={handleEmbedAsPdf}
                    variant="default"
                  >
                    <IconFileTypePdf size={18} />
                  </ActionIcon>
                </Tooltip>
              )}
              <a href={getFileUrl(url)} rel="noopener" target="_blank">
                <ActionIcon aria-label="download file" variant="default">
                  <IconDownload size={18} />
                </ActionIcon>
              </a>
            </Group>
          )}
        </Group>
      </Paper>
    </NodeViewWrapper>
  );
}
