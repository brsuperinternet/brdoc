import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import {
  IconFileTypePdf,
  IconMovie,
  IconMusic,
  IconPaperclip,
  IconPhoto,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { uploadAttachmentAction } from "@/features/editor/components/attachment/upload-attachment-action";
import { uploadAudioAction } from "@/features/editor/components/audio/upload-audio-action";
import { uploadImageAction } from "@/features/editor/components/image/upload-image-action";
import { uploadPdfAction } from "@/features/editor/components/pdf/upload-pdf-action";
import { uploadVideoAction } from "@/features/editor/components/video/upload-video-action";

interface Props {
  editor: Editor;
  templateMode?: boolean;
}

type UploadFn = (
  file: File,
  editor: Editor,
  pos: number,
  pageId: string,
  ...rest: any[]
) => void;

function pickFile(
  editor: Editor,
  accept: string,
  multiple: boolean,
  upload: UploadFn,
  extra?: boolean
) {
  // @ts-expect-error — editor.storage.pageId is set by PageEditor.onCreate
  const pageId = editor.storage?.pageId as string | undefined;
  if (!pageId) {
    return;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = accept;
  input.multiple = multiple;
  input.style.display = "none";
  document.body.appendChild(input);
  input.onchange = () => {
    if (input.files?.length) {
      for (const file of input.files) {
        const pos = editor.view.state.selection.from;
        if (extra === undefined) {
          upload(file, editor, pos, pageId);
        } else {
          upload(file, editor, pos, pageId, extra);
        }
      }
    }
    input.remove();
  };
  input.click();
}

export const MediaGroup: FC<Props> = ({ editor, templateMode }) => {
  const { t } = useTranslation();

  return (
    <Menu position="bottom-start" shadow="md" withArrow={false}>
      <Menu.Target>
        <Tooltip label={t("Insert media")} withArrow>
          <ActionIcon
            aria-label={t("Insert media")}
            color="dark"
            size="md"
            variant="subtle"
          >
            <IconPhoto size={16} />
          </ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {!templateMode && (
          <Menu.Item
            leftSection={<IconPhoto size={16} />}
            onClick={() => pickFile(editor, "image/*", true, uploadImageAction)}
          >
            {t("Image")}
          </Menu.Item>
        )}
        {!templateMode && (
          <Menu.Item
            leftSection={<IconMovie size={16} />}
            onClick={() => pickFile(editor, "video/*", true, uploadVideoAction)}
          >
            {t("Video")}
          </Menu.Item>
        )}
        {!templateMode && (
          <Menu.Item
            leftSection={<IconMusic size={16} />}
            onClick={() => pickFile(editor, "audio/*", true, uploadAudioAction)}
          >
            {t("Audio")}
          </Menu.Item>
        )}
        <Menu.Item
          leftSection={<IconFileTypePdf size={16} />}
          onClick={() =>
            pickFile(editor, "application/pdf", false, uploadPdfAction)
          }
        >
          PDF
        </Menu.Item>
        {!templateMode && (
          <Menu.Item
            leftSection={<IconPaperclip size={16} />}
            onClick={() =>
              pickFile(editor, "", true, uploadAttachmentAction, true)
            }
          >
            {t("File attachment")}
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};
