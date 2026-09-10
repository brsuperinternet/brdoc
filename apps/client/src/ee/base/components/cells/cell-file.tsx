import { ActionIcon, Popover, Text, UnstyledButton } from "@mantine/core";
import {
  IconFile,
  IconPaperclip,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useCallback, useRef, useState } from "react";
import cellClasses from "@/ee/base/styles/cells.module.css";
import { IBaseProperty } from "@/ee/base/types/base.types";
import { uploadFile } from "@/features/page/services/page-service";
import { getFileUrl } from "@/lib/config";

export type FileValue = {
  id: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
  url?: string;
};

function buildFileUrl(
  file: Pick<FileValue, "id" | "fileName" | "url">
): string {
  return (
    file.url ?? `/api/files/${file.id}/${encodeURIComponent(file.fileName)}`
  );
}

type CellFileProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  readOnly?: boolean;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
};

function formatFileSize(bytes?: number): string {
  if (!bytes) {
    return "";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseFiles(value: unknown): FileValue[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (f): f is FileValue =>
      f && typeof f === "object" && "id" in f && "fileName" in f
  );
}

export function CellFile({
  value,
  property,
  isEditing,
  readOnly,
  onCommit,
  onCancel,
}: CellFileProps) {
  const files = parseFiles(value);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleRemove = useCallback(
    (fileId: string) => {
      if (readOnly) {
        return;
      }
      const updated = files.filter((f) => f.id !== fileId);
      onCommit(updated.length > 0 ? updated : null);
    },
    [readOnly, files, onCommit]
  );

  const handleUpload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) {
        return;
      }
      setUploading(true);

      const newFiles: FileValue[] = [...files];

      // Reuse the page-attachment upload pipeline: the base's pageId is passed
      // to the standard /files/upload endpoint, which enforces the same edit
      // access check as any other page attachment.
      for (const file of Array.from(fileList)) {
        try {
          const attachment = await uploadFile(file, property.pageId);
          newFiles.push({
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            id: attachment.id,
            mimeType: attachment.mimeType,
            url: `/api/files/${attachment.id}/${encodeURIComponent(attachment.fileName)}`,
          });
        } catch (err) {
          console.error("File upload failed:", err);
        }
      }

      setUploading(false);
      onCommit(newFiles.length > 0 ? newFiles : null);
    },
    [files, property.pageId, onCommit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel]
  );

  const MAX_VISIBLE = 2;

  if (isEditing) {
    return (
      <Popover
        closeOnClickOutside
        closeOnEscape
        hideDetached={false}
        onChange={(o) => {
          if (!o) {
            onCancel();
          }
        }}
        onClose={onCancel}
        opened
        position="bottom-start"
        trapFocus
        width={280}
      >
        <Popover.Target>
          <div className={cellClasses.popoverTarget}>
            <FileList files={files} maxVisible={MAX_VISIBLE} />
          </div>
        </Popover.Target>
        <Popover.Dropdown onKeyDown={handleKeyDown} p={8}>
          {!readOnly && files.length === 0 && !uploading && (
            <Text c="dimmed" mb={8} size="xs">
              No files attached
            </Text>
          )}

          {files.map((file) => (
            <div className={cellClasses.fileItemRow} key={file.id}>
              <IconFile className={cellClasses.fileItemIcon} size={14} />
              <a
                className={cellClasses.fileItemLink}
                href={getFileUrl(buildFileUrl(file))}
                rel="noreferrer"
                target="_blank"
              >
                <Text fw={500} size="xs" truncate="end">
                  {file.fileName}
                </Text>
                {file.fileSize != null && (
                  <Text c="dimmed" size="xs">
                    {formatFileSize(file.fileSize)}
                  </Text>
                )}
              </a>
              {!readOnly && (
                <ActionIcon
                  color="gray"
                  onClick={() => handleRemove(file.id)}
                  size="xs"
                  variant="subtle"
                >
                  <IconX size={12} />
                </ActionIcon>
              )}
            </div>
          ))}

          {!readOnly && (
            <>
              <input
                multiple
                onChange={(e) => {
                  handleUpload(e.target.files);
                  e.target.value = "";
                }}
                ref={fileInputRef}
                style={{ display: "none" }}
                type="file"
              />

              <UnstyledButton
                className={cellClasses.fileUploadBtn}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  color: uploading
                    ? "var(--mantine-color-gray-5)"
                    : "var(--mantine-color-blue-6)",
                }}
              >
                <IconUpload size={14} />
                {uploading ? "Uploading..." : "Add file"}
              </UnstyledButton>
            </>
          )}
        </Popover.Dropdown>
      </Popover>
    );
  }

  if (files.length === 0) {
    return <span className={cellClasses.emptyValue} />;
  }

  return <FileList files={files} maxVisible={MAX_VISIBLE} />;
}

function FileList({
  files,
  maxVisible,
}: {
  files: FileValue[];
  maxVisible: number;
}) {
  const visible = files.slice(0, maxVisible);
  const overflow = files.length - maxVisible;

  return (
    <div className={cellClasses.fileGroup}>
      {visible.map((file) => (
        <span className={cellClasses.fileBadge} key={file.id}>
          <IconPaperclip size={12} />
          {file.fileName}
        </span>
      ))}
      {overflow > 0 && (
        <span className={cellClasses.overflowCount}>+{overflow}</span>
      )}
    </div>
  );
}
