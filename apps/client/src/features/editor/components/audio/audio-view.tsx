import { isInternalFileUrl } from "@docmost/editor-ext";
import { Group, Loader, Text } from "@mantine/core";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getFileUrl } from "@/lib/config.ts";
import classes from "./audio-view.module.css";

export default function AudioView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { editor, node } = props;
  const { src, placeholder } = node.attrs;

  const safeSrc = useMemo(() => {
    if (!(src && isInternalFileUrl(src))) {
      return null;
    }
    return getFileUrl(src);
  }, [src]);

  const previewSrc = useMemo(() => {
    editor.storage.shared.audioPreviews =
      editor.storage.shared.audioPreviews || {};

    if (placeholder?.id) {
      return editor.storage.shared.audioPreviews[placeholder.id];
    }

    return null;
  }, [placeholder, editor]);

  return (
    <NodeViewWrapper data-drag-handle>
      <div
        className={`${classes.audioWrapper} ${!safeSrc && placeholder ? classes.skeleton : ""}`}
      >
        {safeSrc && (
          <audio
            aria-label={placeholder?.name || t("Audio")}
            className={classes.audio}
            controls
            preload="metadata"
            src={safeSrc}
          />
        )}
        {!safeSrc && previewSrc && (
          <Group pos="relative" w="100%">
            <audio
              aria-label={placeholder?.name || t("Audio")}
              className={classes.audio}
              controls
              preload="metadata"
              src={previewSrc}
            />
            <Loader pos="absolute" right={6} size={20} top={6} />
          </Group>
        )}
        {!(safeSrc || previewSrc) && placeholder && (
          <Group
            gap="xs"
            h={54}
            justify="center"
            maw="100%"
            px="md"
            wrap="nowrap"
          >
            <Loader size={20} style={{ flexShrink: 0 }} />
            <Text component="span" size="sm" truncate="end">
              {placeholder?.name
                ? t("Uploading {{name}}", { name: placeholder.name })
                : t("Uploading file")}
            </Text>
          </Group>
        )}
        {!(safeSrc || previewSrc || placeholder) && (
          <audio aria-label={t("Audio")} className={classes.audio} controls />
        )}
      </div>
    </NodeViewWrapper>
  );
}
