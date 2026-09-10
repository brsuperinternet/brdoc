import {
  ActionIcon,
  Button,
  Card,
  Group,
  Text,
  useComputedColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { uploadFile } from "@/features/page/services/page-service.ts";
import { svgStringToFile } from "@/lib";
import "@excalidraw/excalidraw/index.css";
import { useHandleLibrary } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { modals } from "@mantine/modals";
import { IconEdit } from "@tabler/icons-react";
import clsx from "clsx";
import ReactClearModal from "react-clear-modal";
import { useTranslation } from "react-i18next";
import { IAttachment } from "@/features/attachments/types/attachment.types";
import { localStorageLibraryAdapter } from "@/features/editor/components/excalidraw/excalidraw-utils.ts";

const ExcalidrawComponent = lazy(() =>
  import("@excalidraw/excalidraw").then((module) => ({
    default: module.Excalidraw,
  }))
);

export default function ExcalidrawView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, editor, selected } = props;
  const { attachmentId } = node.attrs;

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI>(null);
  useHandleLibrary({
    adapter: localStorageLibraryAdapter,
    excalidrawAPI,
  });
  const [excalidrawData, setExcalidrawData] = useState<any>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const computedColorScheme = useComputedColorScheme();

  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const isInitialLoadRef = useRef(true);
  const lastFingerprintRef = useRef("");

  const handleOpen = async () => {
    if (!editor.isEditable) {
      return;
    }
    isDirtyRef.current = false;
    isInitialLoadRef.current = true;
    open();
  };

  const saveData = useCallback(
    async (updateSrc = true) => {
      if (!excalidrawAPI || isSavingRef.current) {
        return;
      }

      isSavingRef.current = true;
      setIsSaving(true);

      try {
        const { exportToSvg } = await import("@excalidraw/excalidraw");

        const svg = await exportToSvg({
          appState: {
            exportEmbedScene: true,
            exportWithDarkMode: false,
          },
          elements: excalidrawAPI?.getSceneElements(),
          files: excalidrawAPI?.getFiles(),
        });

        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svg);

        svgString = svgString.replace(
          /https:\/\/unpkg\.com\/@excalidraw\/excalidraw@undefined/g,
          "https://unpkg.com/@excalidraw/excalidraw@latest"
        );

        const fileName = "diagram.excalidraw.svg";
        const excalidrawSvgFile = await svgStringToFile(svgString, fileName);

        // @ts-expect-error
        const pageId = editor.storage?.pageId;

        let attachment: IAttachment = null;
        if (attachmentId) {
          attachment = await uploadFile(
            excalidrawSvgFile,
            pageId,
            attachmentId
          );
        } else {
          attachment = await uploadFile(excalidrawSvgFile, pageId);
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
    },
    [excalidrawAPI, editor, attachmentId, updateAttributes]
  );

  const handleSaveAndExit = useCallback(async () => {
    try {
      await saveData();
      close();
    } catch {
      /* empty */
    }
  }, [saveData, close]);

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
      if (isDirtyRef.current && !isSavingRef.current) {
        saveData(false).catch(() => {});
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [opened, saveData]);

  return (
    <NodeViewWrapper data-drag-handle>
      <ReactClearModal
        contentProps={{
          style: {
            padding: 0,
            width: "90vw",
          },
        }}
        disableCloseOnBgClick={true}
        isOpen={opened}
        onRequestClose={handleClose}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: 0,
          zIndex: 200,
        }}
      >
        <Group
          bg="var(--mantine-color-body)"
          justify="flex-end"
          p="xs"
          wrap="nowrap"
        >
          <Button
            loading={isSaving}
            onClick={handleSaveAndExit}
            size={"compact-sm"}
          >
            {t("Save & Exit")}
          </Button>
          <Button color="red" onClick={handleClose} size={"compact-sm"}>
            {t("Exit")}
          </Button>
        </Group>
        <div style={{ height: "90vh" }}>
          <Suspense fallback={null}>
            <ExcalidrawComponent
              excalidrawAPI={(api) => setExcalidrawAPI(api)}
              initialData={{
                ...excalidrawData,
                scrollToContent: true,
              }}
              onChange={(elements, _appState, files) => {
                const fingerprint = `${elements.length}:${elements.reduce((s, e) => s + (e.version || 0), 0)}:${Object.keys(files).length}`;
                if (isInitialLoadRef.current) {
                  lastFingerprintRef.current = fingerprint;
                  isInitialLoadRef.current = false;
                  return;
                }
                if (fingerprint !== lastFingerprintRef.current) {
                  lastFingerprintRef.current = fingerprint;
                  isDirtyRef.current = true;
                }
              }}
              theme={computedColorScheme}
            />
          </Suspense>
        </div>
      </ReactClearModal>

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
            aria-label={t("Edit drawing")}
            color="gray"
            variant="transparent"
          >
            <IconEdit size={18} />
          </ActionIcon>

          <Text c="dimmed" component="span" size="lg">
            {t("Double-click to edit Excalidraw diagram")}
          </Text>
        </div>
      </Card>
    </NodeViewWrapper>
  );
}
