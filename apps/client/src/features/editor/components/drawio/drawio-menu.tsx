import { isEditorReady } from "@docmost/editor-ext";
import {
  ActionIcon,
  LoadingOverlay,
  Modal,
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
import { lightboxRequestAtom } from "@/features/editor/atoms/editor-atoms";
import { useAltTextControl } from "@/features/editor/components/common/use-alt-text-control.tsx";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import { uploadFile } from "@/features/page/services/page-service.ts";
import { getDrawioUrl, getFileUrl } from "@/lib/config.ts";
import { decodeBase64ToSvgString, svgStringToFile } from "@/lib/utils";
import classes from "../common/toolbar-menu.module.css";

export function DrawioMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();
  const setLightboxRequest = useSetAtom(lightboxRequestAtom);
  const [opened, { open, close }] = useDisclosure(false);
  const [initialXML, setInitialXML] = useState<string>("");
  const drawioRef = useRef<DrawIoEmbedRef>(null);
  const computedColorScheme = useComputedColorScheme();
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      const drawioAttr = ctx.editor.getAttributes("drawio");
      return {
        alt: drawioAttr?.alt || "",
        attachmentId: drawioAttr?.attachmentId || null,
        isAlignCenter: ctx.editor.isActive("drawio", { align: "center" }),
        isAlignLeft: ctx.editor.isActive("drawio", { align: "left" }),
        isAlignRight: ctx.editor.isActive("drawio", { align: "right" }),
        isDrawio: ctx.editor.isActive("drawio"),
        src: drawioAttr?.src || null,
      };
    },
  });

  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!state) {
        return false;
      }

      return editor.isActive("drawio") && editor.getAttributes("drawio")?.src;
    },
    [editor]
  );

  const getReferencedVirtualElement = useCallback(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "drawio";
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
      .setDrawioAlign("left")
      .run();
  }, [editor]);

  const alignCenter = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setDrawioAlign("center")
      .run();
  }, [editor]);

  const alignRight = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .setDrawioAlign("right")
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
    nodeName: "drawio",
  });

  const saveData = useCallback(
    async (svgXml: string) => {
      if (isSavingRef.current) {
        return;
      }

      isSavingRef.current = true;
      setIsSaving(true);

      try {
        const svgString = decodeBase64ToSvgString(svgXml);
        const fileName = "diagram.drawio.svg";
        const drawioSVGFile = await svgStringToFile(svgString, fileName);

        // @ts-expect-error
        const pageId = editor.storage?.pageId;
        const attachmentId = editorState?.attachmentId;

        let attachment: IAttachment = null;
        if (attachmentId) {
          attachment = await uploadFile(drawioSVGFile, pageId, attachmentId);
        } else {
          attachment = await uploadFile(drawioSVGFile, pageId);
        }

        editor.commands.updateAttributes("drawio", {
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
    },
    [editor, editorState?.attachmentId]
  );

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
      const blob = await request.blob();

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = (reader.result || "") as string;
        setInitialXML(base64data);
      };
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      isDirtyRef.current = false;
      open();
    }
  }, [editorState?.src, open]);

  useEffect(() => {
    if (!opened) {
      return;
    }

    const interval = setInterval(() => {
      if (isDirtyRef.current && !isSavingRef.current && drawioRef.current) {
        drawioRef.current.exportDiagram({ format: "xmlsvg" });
      }
    }, 60_000);

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
    <>
      <BaseBubbleMenu
        editor={editor}
        getReferencedVirtualElement={getReferencedVirtualElement}
        options={{
          flip: false,
          offset: 8,
          placement: "top",
        }}
        pluginKey={"drawio-menu"}
        ref={(element) => {
          if (element) {
            element.style.zIndex = "99";
          }
        }}
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
                className={clsx({ [classes.active]: editorState?.isAlignLeft })}
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

            <Tooltip label={t("Align right")} position="top">
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

      <Modal.Root
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
                  saveData(data.data).catch(() => {});
                }}
                onSave={(data: EventSave) => {
                  if (data.parentEvent !== "save") {
                    return;
                  }
                  saveData(data.xml)
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
    </>
  );
}

export default DrawioMenu;
