import { Group, Image, Loader, Text } from "@mantine/core";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import clsx from "clsx";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getFileUrl } from "@/lib/config.ts";
import classes from "./image-view.module.css";

export default function ImageView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { editor, node, selected } = props;
  const { src, width, align, alt, aspectRatio, placeholder } = node.attrs;
  const alignClass = useMemo(() => {
    if (align === "left") {
      return "alignLeft";
    }
    if (align === "right") {
      return "alignRight";
    }
    if (align === "center") {
      return "alignCenter";
    }
    return "alignCenter";
  }, [align]);
  const previewSrc = useMemo(() => {
    editor.storage.shared.imagePreviews =
      editor.storage.shared.imagePreviews || {};

    if (placeholder?.id) {
      return editor.storage.shared.imagePreviews[placeholder.id];
    }

    return null;
  }, [placeholder, editor]);

  return (
    <NodeViewWrapper data-drag-handle>
      <div
        className={clsx(
          selected && "ProseMirror-selectednode",
          classes.imageWrapper,
          !src && placeholder && classes.skeleton,
          alignClass
        )}
        style={{
          aspectRatio: aspectRatio ? aspectRatio : src ? undefined : "16 / 9",
          width,
        }}
      >
        {src && (
          <Image alt={alt} fit="contain" radius="md" src={getFileUrl(src)} />
        )}
        {!src && previewSrc && (
          <Group h="100%" pos="relative" w="100%">
            <Image
              alt={placeholder?.name}
              fit="contain"
              radius="md"
              src={previewSrc}
            />
            <Loader bottom={6} pos="absolute" right={6} size={20} />
          </Group>
        )}
        {!(src || previewSrc) && placeholder && (
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
