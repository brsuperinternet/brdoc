import {
  Button,
  FileButton,
  Group,
  Modal,
  SimpleGrid,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBrandNotion,
  IconCheck,
  IconFileCode,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeZip,
  IconMarkdown,
  IconX,
} from "@tabler/icons-react";
import bytes from "bytes";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfluenceIcon } from "@/components/icons/confluence-icon.tsx";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import { getFileTaskById } from "@/features/file-task/services/file-task-service.ts";
import {
  importPage,
  importZip,
} from "@/features/page/services/page-service.ts";
import { treeDataAtom } from "@/features/page/tree/atoms/tree-data-atom.ts";
import { buildTree } from "@/features/page/tree/utils";
import { IPage } from "@/features/page/types/page.types.ts";
import { useQueryEmit } from "@/features/websocket/use-query-emit.ts";
import { formatBytes } from "@/lib";
import { getFileImportSizeLimit } from "@/lib/config.ts";
import { queryClient } from "@/main.tsx";

interface PageImportModalProps {
  onClose: () => void;
  open: boolean;
  spaceId: string;
}

export default function PageImportModal({
  spaceId,
  open,
  onClose,
}: PageImportModalProps) {
  const { t } = useTranslation();
  return (
    <>
      <Modal.Root
        keepMounted={true}
        mah={400}
        onClose={onClose}
        opened={open}
        padding="xl"
        size={600}
        xOffset={0}
        yOffset="10vh"
      >
        <Modal.Overlay />
        <Modal.Content style={{ overflow: "hidden" }}>
          <Modal.Header py={0}>
            <Modal.Title fw={500}>{t("Import pages")}</Modal.Title>
            <Modal.CloseButton aria-label={t("Close")} />
          </Modal.Header>
          <Modal.Body>
            <ImportFormatSelection onClose={onClose} spaceId={spaceId} />
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}

interface ImportFormatSelection {
  onClose: () => void;
  spaceId: string;
}
function ImportFormatSelection({ spaceId, onClose }: ImportFormatSelection) {
  const { t } = useTranslation();
  const [treeData, setTreeData] = useAtom(treeDataAtom);
  const [fileTaskId, setFileTaskId] = useState<string | null>(null);
  const emit = useQueryEmit();

  const markdownFileRef = useRef<() => void>(null);
  const htmlFileRef = useRef<() => void>(null);
  const docxFileRef = useRef<() => void>(null);
  const pdfFileRef = useRef<() => void>(null);
  const notionFileRef = useRef<() => void>(null);
  const confluenceFileRef = useRef<() => void>(null);
  const zipFileRef = useRef<() => void>(null);

  const canUseConfluence = useHasFeature(Feature.CONFLUENCE_IMPORT);
  const canUseDocx = useHasFeature(Feature.DOCX_IMPORT);
  const canUsePdf = useHasFeature(Feature.PDF_IMPORT);
  const upgradeLabel = useUpgradeLabel();

  const handleZipUpload = async (selectedFile: File, source: string) => {
    if (!selectedFile) {
      return;
    }

    const maxSize = getFileImportSizeLimit();
    if (selectedFile.size > maxSize) {
      notifications.show({
        color: "red",
        message: t("File exceeds the {{limit}} import limit", {
          limit: formatBytes(maxSize),
        }),
      });
      return;
    }

    try {
      onClose();

      notifications.show({
        autoClose: false,
        id: "import",
        loading: true,
        message: t("Please don't close this tab."),
        title: t("Uploading import file"),
        withCloseButton: false,
      });

      const importTask = await importZip(selectedFile, spaceId, source);
      notifications.update({
        autoClose: false,
        id: "import",
        loading: true,
        message: t(
          "Page import is in progress. You can check back later if this takes longer."
        ),
        title: t("Importing pages"),
        withCloseButton: true,
      });

      setFileTaskId(importTask.id);

      // Reset file input after successful upload
      if (source === "notion" && notionFileRef.current) {
        notionFileRef.current();
      } else if (source === "confluence" && confluenceFileRef.current) {
        confluenceFileRef.current();
      } else if (source === "generic" && zipFileRef.current) {
        zipFileRef.current();
      }
    } catch (err) {
      console.log("Failed to upload import file", err);
      notifications.update({
        autoClose: false,
        color: "red",
        icon: <IconX size={18} />,
        id: "import",
        loading: false,
        message: err?.response.data.message,
        title: t("Failed to upload import file"),
        withCloseButton: true,
      });
    }
  };

  useEffect(() => {
    if (!fileTaskId) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const fileTask = await getFileTaskById(fileTaskId);
        const status = fileTask.status;

        if (status === "success") {
          notifications.update({
            autoClose: false,
            color: "teal",
            icon: <IconCheck size={18} />,
            id: "import",
            loading: false,
            message: t("Your pages were successfully imported."),
            title: t("Import complete"),
            withCloseButton: true,
          });
          clearInterval(intervalId);
          setFileTaskId(null);

          await queryClient.refetchQueries({
            queryKey: ["root-sidebar-pages", fileTask.spaceId],
          });

          await queryClient.invalidateQueries({
            queryKey: ["recent-changes", fileTask.spaceId],
          });

          setTimeout(() => {
            emit({
              operation: "refetchRootTreeNodeEvent",
              spaceId,
            });
          }, 50);
        }

        if (status === "failed") {
          notifications.update({
            autoClose: false,
            color: "red",
            icon: <IconX size={18} />,
            id: "import",
            loading: false,
            message: t(
              "Something went wrong while importing pages: {{reason}}.",
              {
                reason: fileTask.errorMessage,
              }
            ),
            title: t("Page import failed"),
            withCloseButton: true,
          });
          clearInterval(intervalId);
          setFileTaskId(null);
          console.error(fileTask.errorMessage);
        }
      } catch (err) {
        notifications.update({
          autoClose: false,
          color: "red",
          icon: <IconX size={18} />,
          id: "import",
          loading: false,
          message: t(
            "Something went wrong while importing pages: {{reason}}.",
            {
              reason: err.response?.data.message,
            }
          ),
          title: t("Import failed"),
          withCloseButton: true,
        });
        clearInterval(intervalId);
        setFileTaskId(null);
        console.error("Failed to fetch import status", err);
      }
    }, 3000);
  }, [fileTaskId]);

  const maxSingleFileSize = bytes("30mb");

  const handleFileUpload = async (selectedFiles: File[]) => {
    if (!selectedFiles) {
      return;
    }

    const oversizedFiles = selectedFiles.filter(
      (f) => f.size > maxSingleFileSize
    );
    if (oversizedFiles.length > 0) {
      notifications.show({
        color: "red",
        message: t("File exceeds the {{limit}} import limit", {
          limit: formatBytes(maxSingleFileSize),
        }),
      });
      return;
    }

    onClose();

    const alert = notifications.show({
      autoClose: false,
      loading: true,
      message: t("Page import is in progress. Please do not close this tab."),
      title: t("Importing pages"),
    });

    const pages: IPage[] = [];
    let pageCount = 0;

    for (const file of selectedFiles) {
      try {
        const page = await importPage(file, spaceId);
        pages.push(page);
        pageCount += 1;
      } catch (err) {
        console.log("Failed to import page", err);
      }
    }

    if (pages?.length > 0 && pageCount > 0) {
      const newTreeNodes = buildTree(pages);
      const fullTree = treeData.concat(newTreeNodes);

      if (newTreeNodes?.length && fullTree?.length > 0) {
        setTreeData(fullTree);
      }

      // Reset file inputs after successful upload
      if (markdownFileRef.current) {
        markdownFileRef.current();
      }
      if (htmlFileRef.current) {
        htmlFileRef.current();
      }
      if (docxFileRef.current) {
        docxFileRef.current();
      }
      if (pdfFileRef.current) {
        pdfFileRef.current();
      }

      const pageCountText =
        pageCount === 1 ? `1 ${t("page")}` : `${pageCount} ${t("pages")}`;

      notifications.update({
        autoClose: 5000,
        color: "teal",
        icon: <IconCheck size={18} />,
        id: alert,
        loading: false,
        message: t("Your import is complete."),
        title: `${t("Successfully imported")} ${pageCountText}`,
      });
    } else {
      notifications.update({
        autoClose: 5000,
        color: "red",
        icon: <IconX size={18} />,
        id: alert,
        loading: false,
        message: t("Unable to import pages. Please try again."),
        title: t("Failed to import pages"),
      });
    }
  };

  // @ts-expect-error
  return (
    <>
      <SimpleGrid cols={2}>
        <FileButton
          accept=".md"
          inputProps={{
            "aria-label": t("Choose {{format}} file", { format: "Markdown" }),
          }}
          multiple
          onChange={handleFileUpload}
          resetRef={markdownFileRef}
        >
          {(props) => (
            <Button
              justify="start"
              leftSection={<IconMarkdown size={18} />}
              variant="default"
              {...props}
            >
              Markdown
            </Button>
          )}
        </FileButton>

        <FileButton
          accept="text/html"
          inputProps={{
            "aria-label": t("Choose {{format}} file", { format: "HTML" }),
          }}
          multiple
          onChange={handleFileUpload}
          resetRef={htmlFileRef}
        >
          {(props) => (
            <Button
              justify="start"
              leftSection={<IconFileCode size={18} />}
              variant="default"
              {...props}
            >
              HTML
            </Button>
          )}
        </FileButton>

        <FileButton
          accept=".docx"
          inputProps={{
            "aria-label": t("Choose {{format}} file", {
              format: "Word (DOCX)",
            }),
          }}
          multiple
          onChange={handleFileUpload}
          resetRef={docxFileRef}
        >
          {(props) => (
            <Tooltip disabled={canUseDocx} label={upgradeLabel}>
              <Button
                disabled={!canUseDocx}
                justify="start"
                leftSection={<IconFileTypeDocx size={18} />}
                variant="default"
                {...props}
              >
                Word (DOCX)
              </Button>
            </Tooltip>
          )}
        </FileButton>

        <FileButton
          accept=".pdf"
          inputProps={{
            "aria-label": t("Choose {{format}} file", { format: "PDF" }),
          }}
          multiple
          onChange={handleFileUpload}
          resetRef={pdfFileRef}
        >
          {(props) => (
            <Tooltip disabled={canUsePdf} label={upgradeLabel}>
              <Button
                disabled={!canUsePdf}
                justify="start"
                leftSection={<IconFileTypePdf size={18} />}
                variant="default"
                {...props}
              >
                PDF
              </Button>
            </Tooltip>
          )}
        </FileButton>

        <FileButton
          accept="application/zip"
          inputProps={{
            "aria-label": t("Choose {{format}} file", { format: "Notion" }),
          }}
          onChange={(file) => handleZipUpload(file, "notion")}
          resetRef={notionFileRef}
        >
          {(props) => (
            <Button
              justify="start"
              leftSection={<IconBrandNotion size={18} />}
              variant="default"
              {...props}
            >
              Notion
            </Button>
          )}
        </FileButton>
        <FileButton
          accept="application/zip"
          inputProps={{
            "aria-label": t("Choose {{format}} file", { format: "Confluence" }),
          }}
          onChange={(file) => handleZipUpload(file, "confluence")}
          resetRef={confluenceFileRef}
        >
          {(props) => (
            <Tooltip disabled={canUseConfluence} label={upgradeLabel}>
              <Button
                disabled={!canUseConfluence}
                justify="start"
                leftSection={<ConfluenceIcon size={18} />}
                variant="default"
                {...props}
              >
                Confluence
              </Button>
            </Tooltip>
          )}
        </FileButton>
      </SimpleGrid>

      <Group gap="xl" justify="center" mih={150}>
        <div>
          <Text inline size="lg" ta="center">
            Import zip file
          </Text>
          <Text c="dimmed" inline py="sm" size="sm" ta="center">
            {t(
              "Upload zip file containing Markdown and HTML files. Max: {{sizeLimit}}",
              {
                sizeLimit: formatBytes(getFileImportSizeLimit()),
              }
            )}
          </Text>
          <FileButton
            accept="application/zip"
            inputProps={{
              "aria-label": t("Choose {{format}} file", { format: "ZIP" }),
            }}
            onChange={(file) => handleZipUpload(file, "generic")}
            resetRef={zipFileRef}
          >
            {(props) => (
              <Group justify="center">
                <Button
                  justify="center"
                  leftSection={<IconFileTypeZip size={18} />}
                  {...props}
                >
                  {t("Upload file")}
                </Button>
              </Group>
            )}
          </FileButton>
        </div>
      </Group>
    </>
  );
}
