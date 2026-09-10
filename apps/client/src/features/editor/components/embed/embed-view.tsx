import {
  getEmbedProviderById,
  getEmbedUrlAndProvider,
  sanitizeUrl,
} from "@docmost/editor-ext";
import {
  ActionIcon,
  Button,
  Card,
  FocusTrap,
  Group,
  Popover,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconEdit } from "@tabler/icons-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import clsx from "clsx";
import i18n from "i18next";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { ResizableWrapper } from "../common/resizable-wrapper";
import classes from "./embed-view.module.css";

const schema = z.object({
  url: z.url({ message: i18n.t("Please enter a valid url") }).trim(),
});

export default function EmbedView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, selected, updateAttributes, editor } = props;
  const { src, provider, width: nodeWidth, height: nodeHeight } = node.attrs;

  const embedUrl = useMemo(() => {
    if (src) {
      return getEmbedUrlAndProvider(src).embedUrl;
    }
    return null;
  }, [src]);

  const embedForm = useForm<{ url: string }>({
    initialValues: {
      url: "",
    },
    validate: zod4Resolver(schema),
  });

  const handleResize = useCallback(
    (newWidth: number, newHeight: number) => {
      updateAttributes({ height: newHeight, width: newWidth });
    },
    [updateAttributes]
  );

  async function onSubmit(data: { url: string }) {
    if (!editor.isEditable) {
      return;
    }

    if (provider) {
      const embedProvider = getEmbedProviderById(provider);
      if (embedProvider.id === "iframe") {
        updateAttributes({ src: sanitizeUrl(data.url) });
        return;
      }
      if (embedProvider.regex.test(data.url)) {
        updateAttributes({ src: sanitizeUrl(data.url) });
      } else {
        notifications.show({
          color: "red",
          message: t("Invalid {{provider}} embed link", {
            provider: embedProvider.name,
          }),
          position: "top-right",
        });
      }
    }
  }

  return (
    <NodeViewWrapper className={classes.embedNodeView} data-drag-handle>
      {embedUrl ? (
        <div className={classes.embedContainer}>
          <ResizableWrapper
            className={clsx(classes.embedWrapper, {
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
              allow="encrypted-media; clipboard-read; clipboard-write; picture-in-picture;"
              allowFullScreen
              className={classes.embedIframe}
              frameBorder="0"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              src={sanitizeUrl(embedUrl)}
            />
          </ResizableWrapper>
        </div>
      ) : (
        <Popover
          disabled={!editor.isEditable}
          position="bottom"
          shadow="md"
          width={300}
          withArrow
        >
          <Popover.Target>
            <Card
              className={clsx(selected ? "ProseMirror-selectednode" : "")}
              p="xs"
              radius="md"
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
              }}
              withBorder
            >
              <div style={{ alignItems: "center", display: "flex" }}>
                <ActionIcon
                  aria-label={t("Edit embed")}
                  color="gray"
                  variant="transparent"
                >
                  <IconEdit size={18} />
                </ActionIcon>

                <Text c="dimmed" component="span" size="lg">
                  {t("Embed {{provider}}", {
                    provider: getEmbedProviderById(provider)?.name,
                  })}
                </Text>
              </div>
            </Card>
          </Popover.Target>
          <Popover.Dropdown bg="var(--mantine-color-body)">
            <form onSubmit={embedForm.onSubmit(onSubmit)}>
              <FocusTrap active={true}>
                <TextInput
                  key={embedForm.key("url")}
                  placeholder={t("Enter {{provider}} link to embed", {
                    provider: getEmbedProviderById(provider).name,
                  })}
                  {...embedForm.getInputProps("url")}
                  data-autofocus
                />
              </FocusTrap>

              <Group justify="center" mt="xs">
                <Button type="submit">{t("Embed link")}</Button>
              </Group>
            </form>
          </Popover.Dropdown>
        </Popover>
      )}
    </NodeViewWrapper>
  );
}
