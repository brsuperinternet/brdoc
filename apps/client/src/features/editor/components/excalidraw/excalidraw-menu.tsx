import { isEditorReady } from "@docmost/editor-ext";
import {
  ActionIcon,
  Button,
  Group,
  Text,
  Tooltip,
  useComputedColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import {
  IconDownload,
  IconEdit,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignRight,
  IconTrash,
  IconZoomIn,
} from "@tabler/icons-react";
import { Node as PMNode } from "@tiptap/pm/model";
import { findParentNode, posToDOMRect, useEditorState } from "@tiptap/react";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react/menus";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import { uploadFile } from "@/features/page/services/page-service.ts";
import { svgStringToFile } from "@/lib";
import { getFileUrl } from "@/lib/config.ts";
import "@excalidraw/excalidraw/index.css";
import { useHandleLibrary } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import ReactClearModal from "react-clear-modal";
import { IAttachment } from "@/features/attachments/types/attachment.types";
import { lightboxRequestAtom } from "@/features/editor/atoms/editor-atoms";
import { useAltTextControl } from "@/features/editor/components/common/use-alt-text-control.tsx";
import { localStorageLibraryAdapter } from "@/features/editor/components/excalidraw/excalidraw-utils.ts";
import classes from "../common/toolbar-menu.module.css";

const ExcalidrawComponent = lazy(() =>
  import("@excalidraw/excalidraw").then((module) => ({
    default: module.Excalidraw,
  }))
);

export function ExcalidrawMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();
  const setLightboxRequest = useSetAtom(lightboxRequestAtom);
  const [opened, { open, close }] = useDisclosure(false);
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI>(null);
  useHandleLibrary({
    adapter: localStorageLibraryAdapter,
    excalidrawAPI,
  });
  const [excalidrawData, setExcalidrawData] = useState<any>(null);
  const computedColorScheme = useComputedColorScheme();
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialLoadRef = useRef(true);
  const lastFingerprintRef = useRef("");

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      const excalidrawAttr = ctx.editor.getAttributes("excalidraw");
      return {
        alt: excalidrawAttr?.alt || "",
        attachmentId: excalidrawAttr?.attachmentId || null,
        isAlignCenter: ctx.editor.isActive("excalidraw", { align: "center" }),
        isAlignLeft: ctx.editor.isActive("excalidraw", { align: "left" }),
        isAlignRight: ctx.editor.isActive("excalidraw", { align: "right" }),
        isExcalidraw: ctx.editor.isActive("excalidraw"),
        src: excalidrawAttr?.src || null,
      };
    },
  });

  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!state) {
        return false;
      }

      return (
        editor.isActive("excalidraw") && editor.getAttributes("excalidraw")?.src
      );
    },
    [editor]
  );

  const getReferencedVirtualElement = useCallback(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "excalidraw";
    const parent = findParentNode(predicate)(selection);

    if (parent) {
      const dom = editor.view.nodeDOM(parent?.pos) as HTMLElement;
      const domRect = dom.getBoundingClientRect();
      return {
        getBoundingClientRect: () => domRect,
        getClientRects: () => [domRect],
      };
    }

    const domRect = posToDOMRect(editor.view, selection.from, selection.to);
    return {
      getBoundingClientRect: () => domRect,
      getClientRects: () => [domRect],
    };
  }, [editor]);

  const alignLeft = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setExcalidrawAlign("left")
      .run();
  }, [editor]);

  const alignCenter = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setExcalidrawAlign("center")
      .run();
  }, [editor]);

  const alignRight = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setExcalidrawAlign("right")
      .run();
  }, [editor]);

  const handleDownload = useCallback(() => {
    if (!editorState?.src) {
      return;
    }
    const url = getFileUrl(editorState.src);
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.click();
  }, [editorState?.src]);

  const handleDelete = useCallback(() => {
    editor.commands.deleteSelection();
  }, [editor]);

  const {
    button: altTextButton,
    panel: altTextPanel,
    isEditing: isEditingAlt,
  } = useAltTextControl({
    currentAlt: editorState?.alt || "",
    editor,
    nodeName: "excalidraw",
  });

  const handleOpen = useCallback(async () => {
    if (!editorState?.src) {
      return;
    }

    setIsLoading(true);
    try {
      const url = getFileUrl(editorState.src);
      const request = await fetch(url, {
        cache: "no-store",
        credentials: "include",
      });

      const { loadFromBlob } = await import("@excalidraw/excalidraw");
      const data = await loadFromBlob(await request.blob(), null, null);
      setExcalidrawData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      isDirtyRef.current = false;
      isInitialLoadRef.current = true;
      open();
    }
  }, [editorState?.src, open]);

  const saveData = useCallback(async () => {
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
      const attachmentId = editorState?.attachmentId;

      let attachment: IAttachment = null;
      if (attachmentId) {
        attachment = await uploadFile(excalidrawSvgFile, pageId, attachmentId);
      } else {
        attachment = await uploadFile(excalidrawSvgFile, pageId);
      }

      editor.commands.updateAttributes("excalidraw", {
        attachmentId: attachment.id,
        size: attachment.fileSize,
        src: `/api/files/${attachment.id}/${attachment.fileName}?t=${new Date(attachment.updatedAt).getTime()}`,
        title: attachment.fileName,
      });

      isDirtyRef.current = false;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [editor, excalidrawAPI, editorState?.attachmentId]);

  const handleSaveAndExit = useCallback(async () => {
    try {
      await saveData();
      close();
    } catch {
      // save failed, modal stays open
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
        saveData().catch(() => {});
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [opened, saveData]);

  return (
    <>
      <BaseBubbleMenu
        editor={editor}
        getReferencedVirtualElement={getReferencedVirtualElement}
        options={{
          flip: false,
          offset: 8,
          placement: "top",
        }}
        pluginKey={"excalidraw-menu"}
        shouldShow={shouldShow}
        updateDelay={0}
      >
        {isEditingAlt ? (
          altTextPanel
        ) : (
          <div className={classes.toolbar}>
            <Tooltip
              label={t("Align left")}
              position="top"
              withinPortal={false}
            >
              <ActionIcon
                aria-label={t("Align left")}
                className={clsx({
                  [classes.active]: editorState?.isAlignLeft,
                })}
                onClick={alignLeft}
                size="lg"
                variant="subtle"
              >
                <IconLayoutAlignLeft size={18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip
              label={t("Align center")}
              position="top"
              withinPortal={false}
            >
              <ActionIcon
                aria-label={t("Align center")}
                className={clsx({
                  [classes.active]: editorState?.isAlignCenter,
                })}
                onClick={alignCenter}
                size="lg"
                variant="subtle"
              >
                <IconLayoutAlignCenter size={18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip
              label={t("Align right")}
              position="top"
              withinPortal={false}
            >
              <ActionIcon
                aria-label={t("Align right")}
                className={clsx({
                  [classes.active]: editorState?.isAlignRight,
                })}
                onClick={alignRight}
                size="lg"
                variant="subtle"
              >
                <IconLayoutAlignRight size={18} />
              </ActionIcon>
            </Tooltip>

            <div className={classes.divider} />

            {altTextButton}

            <div className={classes.divider} />

            <Tooltip label={t("Expand")} position="top" withinPortal={false}>
              <ActionIcon
                aria-label={t("Expand")}
                onClick={() =>
                  editorState?.src &&
                  setLightboxRequest({
                    src: getFileUrl(editorState.src),
                    type: "image",
                  })
                }
                size="lg"
                variant="subtle"
              >
                <IconZoomIn size={18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={t("Edit")} position="top" withinPortal={false}>
              <ActionIcon
                aria-label={t("Edit")}
                loading={isLoading}
                onClick={handleOpen}
                size="lg"
                variant="subtle"
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={t("Download")} position="top" withinPortal={false}>
              <ActionIcon
                aria-label={t("Download")}
                onClick={handleDownload}
                size="lg"
                variant="subtle"
              >
                <IconDownload size={18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={t("Delete")} position="top" withinPortal={false}>
              <ActionIcon
                aria-label={t("Delete")}
                onClick={handleDelete}
                size="lg"
                variant="subtle"
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          </div>
        )}
      </BaseBubbleMenu>

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
    </>
  );
}

export default ExcalidrawMenu;
