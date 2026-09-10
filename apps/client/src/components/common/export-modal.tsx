import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Select,
  Switch,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import {
  exportPage,
  exportPageToDocx,
} from "@/features/page/services/page-service.ts";
import { ExportFormat } from "@/features/page/types/page.types.ts";
import { exportSpace } from "@/features/space/services/space-service";

interface ExportModalProps {
  id: string;
  onClose: () => void;
  open: boolean;
  type: "space" | "page";
}

export default function ExportModal({
  id,
  type,
  open,
  onClose,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>(ExportFormat.Markdown);
  const [includeChildren, setIncludeChildren] = useState<boolean>(false);
  const [includeAttachments, setIncludeAttachments] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const { t } = useTranslation();
  const upgradeLabel = useUpgradeLabel();
  const isDocx = format === ExportFormat.Docx;
  const docxEntitled = useHasFeature(Feature.DOCX_EXPORT);
  const blockedByLicense = isDocx && !docxEntitled;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (type === "page") {
        if (format === ExportFormat.Docx) {
          await exportPageToDocx({ pageId: id });
        } else {
          await exportPage({
            format,
            includeAttachments,
            includeChildren,
            pageId: id,
          });
        }
      }
      if (type === "space") {
        await exportSpace({ format, includeAttachments, spaceId: id });
      }
      notifications.show({
        message: t("Export successful"),
      });
      onClose();
    } catch (err) {
      notifications.show({
        color: "red",
        message: "Export failed:" + err.response?.data.message,
      });
      console.error("export error", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleChange = (format: ExportFormat) => {
    setFormat(format);
  };

  return (
    <Modal.Root
      mah={400}
      onClick={(e) => e.stopPropagation()}
      onClose={onClose}
      opened={open}
      padding="xl"
      size={500}
      xOffset={0}
      yOffset="10vh"
    >
      <Modal.Overlay />
      <Modal.Content style={{ overflow: "hidden" }}>
        <Modal.Header py={0}>
          <Modal.Title fw={500}>{t(`Export ${type}`)}</Modal.Title>
          <Modal.CloseButton aria-label={t("Close")} />
        </Modal.Header>
        <Modal.Body>
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Text size="md">{t("Format")}</Text>
            </div>
            <ExportFormatSelection
              docxEntitled={docxEntitled}
              format={format}
              includeDocx={type === "page"}
              onChange={handleChange}
            />
          </Group>

          {type === "page" && !isDocx && (
            <>
              <Divider my="sm" />

              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text size="md">{t("Include subpages")}</Text>
                </div>
                <Switch
                  checked={includeChildren}
                  onChange={(event) =>
                    setIncludeChildren(event.currentTarget.checked)
                  }
                />
              </Group>

              <Group justify="space-between" mt="md" wrap="nowrap">
                <div>
                  <Text size="md">{t("Include attachments")}</Text>
                </div>
                <Switch
                  checked={includeAttachments}
                  onChange={(event) =>
                    setIncludeAttachments(event.currentTarget.checked)
                  }
                />
              </Group>
            </>
          )}

          {type === "space" && (
            <>
              <Divider my="sm" />

              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Text size="md">{t("Include attachments")}</Text>
                </div>
                <Switch
                  checked={includeAttachments}
                  onChange={(event) =>
                    setIncludeAttachments(event.currentTarget.checked)
                  }
                />
              </Group>
            </>
          )}

          <Group justify="center" mt="md">
            <Button onClick={onClose} variant="default">
              {t("Cancel")}
            </Button>
            <Tooltip
              disabled={!blockedByLicense}
              label={upgradeLabel}
              withArrow
            >
              <Button
                data-disabled={blockedByLicense || undefined}
                disabled={blockedByLicense}
                loading={isExporting}
                onClick={handleExport}
              >
                {t("Export")}
              </Button>
            </Tooltip>
          </Group>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}

interface ExportFormatSelection {
  docxEntitled?: boolean;
  format: ExportFormat;
  includeDocx?: boolean;
  onChange: (value: string) => void;
}
function ExportFormatSelection({
  format,
  onChange,
  includeDocx,
  docxEntitled,
}: ExportFormatSelection) {
  const { t } = useTranslation();

  const data = [
    { label: "Markdown", value: "markdown" },
    { label: "HTML", value: "html" },
    ...(includeDocx
      ? [{ disabled: !docxEntitled, label: "Word (.docx)", value: "docx" }]
      : []),
  ];

  return (
    <Select
      allowDeselect={false}
      aria-label={t("Select export format")}
      comboboxProps={{ width: 200 }}
      data={data}
      defaultValue={format}
      onChange={onChange}
      renderOption={({ option }) =>
        option.value === "docx" && !docxEntitled ? (
          <div>
            <Text c="dimmed" size="sm">
              {option.label}
            </Text>
            <Badge mt={4} size="xs">
              {t("Enterprise")}
            </Badge>
          </div>
        ) : (
          <Text size="sm">{option.label}</Text>
        )
      }
      styles={{ option: { opacity: 1 }, wrapper: { maxWidth: 140 } }}
      withCheckIcon={false}
    />
  );
}
