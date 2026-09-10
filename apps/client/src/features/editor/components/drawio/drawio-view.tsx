import {
  ActionIcon,
  Card,
  LoadingOverlay,
  Modal,
  Text,
  useComputedColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { IconEdit } from "@tabler/icons-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DrawIoEmbed,
  DrawIoEmbedRef,
  EventExit,
  EventExport,
  EventSave,
} from "react-drawio";
import { useTranslation } from "react-i18next";
import { IAttachment } from "@/features/attachments/types/attachment.types";
import { uploadFile } from "@/features/page/services/page-service.ts";
import { getDrawioUrl } from "@/lib/config.ts";
import { decodeBase64ToSvgString, svgStringToFile } from "@/lib/utils";

export default function DrawioView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, editor, selected } = props;
  const { attachmentId } = node.attrs;
  const drawioRef = useRef<DrawIoEmbedRef>(null);
  const [initialXML, setInitialXML] = useState<string>("");
  const [opened, { open, close }] = useDisclosure(false);
  const computedColorScheme = useComputedColorScheme();
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = async () => {
    if (!editor.isEditable) {
      return;
    }
    isDirtyRef.current = false;
    open();
  };

  const saveData = async (svgXml: string, updateSrc = true) => {
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const svgString = decodeBase64ToSvgString(svgXml);
      const fileName = "diagram.drawio.svg";
      const drawioSVGFile = await svgStringToFile(svgString, fileName);

      //@ts-expect-error
      const pageId = editor.storage?.pageId;

      let attachment: IAttachment = null;
      if (attachmentId) {
        attachment = await uploadFile(drawioSVGFile, pageId, attachmentId);
      } else {
        attachment = await uploadFile(drawioSVGFile, pageId);
      }

      if (updateSrc) {
        updateAttributes({
          attachmentId: attachment.id,
          size: attachment.fileSize,
          src: `/api/files/${attachment.id}/${attachment.fileName}?t=${new Date(attachment.updatedAt).getTime()}`,
          title: attachment.fileName,
        });
      } else {
        updateAttributes({
          attachmentId: attachment.id,
        });
      }

      isDirtyRef.current = false;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isDirtyRef.current) {
      close();
      return;
    }

    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t("You have unsaved changes that will be lost.")}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Discard") },
      onConfirm: () => {
        isDirtyRef.current = false;
        close();
      },
      title: t("Unsaved changes"),
    });
  }, [close, t]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const interval = setInterval(() => {
      if (isDirtyRef.current && !isSavingRef.current && drawioRef.current) {
        drawioRef.current.exportDiagram({ format: "xmlsvg" });
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [opened]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [opened, handleClose]);

  return (
    <NodeViewWrapper data-drag-handle>
      <Modal.Root
        aria-label={t("Diagram editor")}
        closeOnEscape={false}
        fullScreen
        onClose={handleClose}
        opened={opened}
      >
        <Modal.Overlay />
        <Modal.Content style={{ overflow: "hidden" }}>
          <Modal.Body pos="relative">
            <LoadingOverlay visible={isSaving} />
            <div style={{ height: "100vh" }}>
              <DrawIoEmbed
                autosave
                baseUrl={getDrawioUrl()}
                onAutoSave={() => {
                  isDirtyRef.current = true;
                }}
                onClose={(data: EventExit) => {
                  if (data.parentEvent) {
                    return;
                  }
                  handleClose();
                }}
                onExport={(data: EventExport) => {
                  saveData(data.data, false).catch(() => {});
                }}
                onSave={(data: EventSave) => {
                  if (data.parentEvent !== "save") {
                    return;
                  }
                  saveData(data.xml, true)
                    .then(() => close())
                    .catch(() => {});
                }}
                ref={drawioRef}
                urlParameters={{
                  libraries: true,
                  noSaveBtn: true,
                  saveAndExit: true,
                  spin: true,
                  ui: computedColorScheme === "light" ? "kennedy" : "dark",
                }}
                xml={initialXML}
              />
            </div>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>

      <Card
        className={clsx(selected ? "ProseMirror-selectednode" : "")}
        onClick={(e) => e.detail === 2 && handleOpen()}
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
            aria-label={t("Edit diagram")}
            color="gray"
            variant="transparent"
          >
            <IconEdit size={18} />
          </ActionIcon>

          <Text c="dimmed" component="span" size="lg">
            {t("Double-click to edit Draw.io diagram")}
          </Text>
        </div>
      </Card>
    </NodeViewWrapper>
  );
}
