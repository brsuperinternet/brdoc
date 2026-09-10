import { isInternalFileUrl } from "@docmost/editor-ext";
import { ActionIcon, Group, Loader, Text, Tooltip } from "@mantine/core";
import { IconFileTypePdf, IconPaperclip, IconTrash } from "@tabler/icons-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import clsx from "clsx";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFileUrl } from "@/lib/config.ts";
import { ResizableWrapper } from "../common/resizable-wrapper";
import classes from "./pdf-view.module.css";

export default function PdfView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { editor, node, getPos, selected, updateAttributes } = props;
  const { src, placeholder, width: nodeWidth, height: nodeHeight } = node.attrs;
  const [hasError, setHasError] = useState(false);

  const safeSrc = useMemo(() => {
    if (!(src && isInternalFileUrl(src))) {
      return null;
    }
    return getFileUrl(src);
  }, [src]);

  const handleSelect = useCallback(() => {
    const pos = getPos();
    if (pos !== undefined) {
      editor.commands.setNodeSelection(pos);
    }
  }, [editor, getPos]);

  const handleResize = useCallback(
    (newWidth: number, newHeight: number) => {
      updateAttributes({ height: newHeight, width: newWidth });
    },
    [updateAttributes]
  );

  const handleConvertToAttachment = useCallback(() => {
    if (!src) {
      return;
    }
    const pos = getPos();
    if (pos === undefined) {
      return;
    }
    const currentNode = editor.state.doc.nodeAt(pos);
    if (!currentNode || currentNode.type.name !== "pdf") {
      return;
    }

    editor
      .chain()
      .insertContentAt(
        { from: pos, to: pos + currentNode.nodeSize },
        {
          attrs: {
            attachmentId: currentNode.attrs.attachmentId,
            mime: "application/pdf",
            name: currentNode.attrs.name,
            size: currentNode.attrs.size,
            url: currentNode.attrs.src,
          },
          type: "attachment",
        }
      )
      .run();
  }, [editor, src, getPos]);

  const handleDelete = useCallback(() => {
    const pos = getPos();
    if (pos === undefined) {
      return;
    }
    editor.commands.setNodeSelection(pos);
    editor.commands.deleteSelection();
  }, [editor, getPos]);

  if (!(src && safeSrc)) {
    return (
      <NodeViewWrapper data-drag-handle>
        <div
          className={`${classes.pdfWrapper} ${placeholder ? classes.skeleton : ""}`}
          style={{ height: placeholder ? 600 : undefined }}
        >
          {placeholder && (
            <Group gap="xs" justify="center" maw="100%" px="md" wrap="nowrap">
              <Loader size={20} style={{ flexShrink: 0 }} />
              <Text component="span" size="sm" truncate="end">
                {placeholder?.name
                  ? t("Uploading {{name}}", { name: placeholder.name })
                  : t("Uploading file")}
              </Text>
            </Group>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  if (hasError) {
    return (
      <NodeViewWrapper data-drag-handle>
        <div
          aria-label={t("Failed to load PDF")}
          className={clsx(classes.pdfError, {
            "ProseMirror-selectednode": selected,
          })}
          data-pdf-error
          onClick={handleSelect}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSelect();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <IconFileTypePdf size={32} stroke={1.5} />
          <Text c="dimmed" size="sm">
            {t("Failed to load PDF")}
          </Text>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className={classes.pdfNodeView} data-drag-handle>
      <div className={classes.pdfContainer}>
        <ResizableWrapper
          className={clsx(classes.pdfResizeWrapper, {
            "ProseMirror-selectednode": selected,
          })}
          initialHeight={nodeHeight || 600}
          initialWidth={nodeWidth || 800}
          isEditable={editor.isEditable}
          maxHeight={1200}
          maxWidth={1200}
          minHeight={200}
          minWidth={200}
          onResize={handleResize}
          selected={selected}
        >
          <iframe
            className={classes.pdfIframe}
            frameBorder="0"
            loading="lazy"
            onError={() => setHasError(true)}
            onLoad={(e) => {
              try {
                const iframe = e.currentTarget;
                const status =
                  iframe.contentDocument?.querySelector("pre")?.textContent;
                if (status && status.includes('"statusCode":404')) {
                  setHasError(true);
                }
              } catch {
                // cross-origin - can't inspect, assume OK
              }
            }}
            src={safeSrc}
          />
          {editor.isEditable && (
            <div className={classes.hoverMenu}>
              <Tooltip
                label={t("Convert to attachment")}
                position="top"
                withinPortal
              >
                <ActionIcon
                  aria-label={t("Convert to attachment")}
                  color="dark"
                  onClick={handleConvertToAttachment}
                  size="sm"
                  variant="filled"
                >
                  <IconPaperclip size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label={t("Delete")} position="top" withinPortal>
                <ActionIcon
                  aria-label={t("Delete")}
                  color="dark"
                  onClick={handleDelete}
                  size="sm"
                  variant="filled"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Tooltip>
            </div>
          )}
        </ResizableWrapper>
      </div>
    </NodeViewWrapper>
  );
}
