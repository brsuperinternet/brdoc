import {
  Button,
  Divider,
  Group,
  Modal,
  Select,
  Switch,
  Text,
} from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ExportFormat } from "@/features/page/types/page.types.ts";

interface ExportModalProps {
  onClose: () => void;
  open: boolean;
  type: "space" | "page";
}

export default function ExportModal({ type, open, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>(ExportFormat.Markdown);
  const [includeChildren, setIncludeChildren] = useState<boolean>(false);
  const [includeAttachments, setIncludeAttachments] = useState<boolean>(false);

  const { t } = useTranslation();

  const isDocx = format === ExportFormat.Docx;

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
            <ExportFormatSelection format={format} onChange={handleChange} />
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
          </Group>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}

interface ExportFormatSelection {
  format: ExportFormat;
  onChange: (value: string) => void;
}
function ExportFormatSelection({ format, onChange }: ExportFormatSelection) {
  const { t } = useTranslation();

  const data = [
    { label: "Markdown", value: "markdown" },
    { label: "HTML", value: "html" },
  ];

  return (
    <Select
      allowDeselect={false}
      aria-label={t("Select export format")}
      comboboxProps={{ width: 200 }}
      data={data}
      defaultValue={format}
      onChange={onChange}
      renderOption={({ option }) => <Text size="sm">{option.label}</Text>}
      styles={{ option: { opacity: 1 }, wrapper: { maxWidth: 140 } }}
      withCheckIcon={false}
    />
  );
}
