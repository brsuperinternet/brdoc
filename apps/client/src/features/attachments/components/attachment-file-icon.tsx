import { ThemeIcon } from "@mantine/core";
import {
  type Icon,
  IconFile,
  IconFileTypeCsv,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypePpt,
  IconFileTypeXls,
  IconFileZip,
  IconMovie,
  IconMusic,
  IconPhoto,
} from "@tabler/icons-react";

const EXT_ICONS: Record<string, { icon: Icon; color: string }> = {
  ".7z": { color: "gray", icon: IconFileZip },
  ".csv": { color: "teal", icon: IconFileTypeCsv },
  ".doc": { color: "blue", icon: IconFileTypeDocx },
  ".docx": { color: "blue", icon: IconFileTypeDocx },
  ".gz": { color: "gray", icon: IconFileZip },
  ".pdf": { color: "red", icon: IconFileTypePdf },
  ".ppt": { color: "orange", icon: IconFileTypePpt },
  ".pptx": { color: "orange", icon: IconFileTypePpt },
  ".rar": { color: "gray", icon: IconFileZip },
  ".tar": { color: "gray", icon: IconFileZip },
  ".xls": { color: "teal", icon: IconFileTypeXls },
  ".xlsx": { color: "teal", icon: IconFileTypeXls },
  ".zip": { color: "gray", icon: IconFileZip },
};

const MIME_ICONS: Array<{ prefix: string; icon: Icon; color: string }> = [
  { color: "grape", icon: IconPhoto, prefix: "image/" },
  { color: "violet", icon: IconMovie, prefix: "video/" },
  { color: "pink", icon: IconMusic, prefix: "audio/" },
];

interface AttachmentFileIconProps {
  fileExt?: string;
  mimeType?: string;
}

export function AttachmentFileIcon({
  fileExt,
  mimeType,
}: AttachmentFileIconProps) {
  const byExt = fileExt ? EXT_ICONS[fileExt.toLowerCase()] : undefined;
  const byMime = mimeType
    ? MIME_ICONS.find((entry) => mimeType.startsWith(entry.prefix))
    : undefined;
  const { icon: FileIcon, color } = byExt ??
    byMime ?? { color: "gray", icon: IconFile };

  return (
    <ThemeIcon color={color} radius="md" size={40} variant="light">
      <FileIcon size={22} stroke={1.5} />
    </ThemeIcon>
  );
}
