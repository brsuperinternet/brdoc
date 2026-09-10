import {
  ActionIcon,
  Anchor,
  Center,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@/components/common/search-input.tsx";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { AttachmentFileIcon } from "@/features/attachments/components/attachment-file-icon.tsx";
import { usePageAttachmentsQuery } from "@/features/attachments/queries/attachment-query.ts";
import { IPageAttachment } from "@/features/attachments/types/attachment.types.ts";
import { formatBytes } from "@/lib";
import { getFileUrl } from "@/lib/config.ts";
import { formattedDate } from "@/lib/time.ts";

interface PageAttachmentsModalProps {
  onClose: () => void;
  open: boolean;
  pageId: string;
}

export default function PageAttachmentsModal({
  pageId,
  open,
  onClose,
}: PageAttachmentsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={open}
      size={800}
      title={t("Attachments")}
    >
      <PageAttachmentsList pageId={pageId} />
    </Modal>
  );
}

function PageAttachmentsList({ pageId }: { pageId: string }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const {
    data,
    isLoading,
    isError,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePageAttachmentsQuery(pageId, search);

  const attachments = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!(sentinel && hasNextPage)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  return (
    <>
      <SearchInput
        onSearch={handleSearch}
        placeholder={t("Search attachments...")}
      />

      {isLoading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : isError ? (
        <Center py="xl">
          <Text c="dimmed" size="sm">
            {t("Error loading attachments.")}
          </Text>
        </Center>
      ) : attachments.length === 0 ? (
        <Center py="xl">
          <Text c="dimmed" size="sm">
            {search
              ? t("No results found")
              : t("No attachments on this page yet.")}
          </Text>
        </Center>
      ) : (
        <ScrollArea.Autosize mah={480} scrollbarSize={5} type="scroll">
          {attachments.map((attachment) => (
            <AttachmentRow attachment={attachment} key={attachment.id} />
          ))}
          {hasNextPage && <div ref={loadMoreRef} style={{ height: 1 }} />}
          {isFetchingNextPage && (
            <Center py="sm">
              <Loader size="sm" />
            </Center>
          )}
        </ScrollArea.Autosize>
      )}
    </>
  );
}

function AttachmentRow({ attachment }: { attachment: IPageAttachment }) {
  const { t } = useTranslation();
  const fileUrl = getFileUrl(attachment.url);

  return (
    <Group gap="md" pr="xs" py="sm" wrap="nowrap">
      <AttachmentFileIcon
        fileExt={attachment.fileExt}
        mimeType={attachment.mimeType}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <Anchor
          c="inherit"
          fw={500}
          href={fileUrl}
          rel="noopener noreferrer"
          size="sm"
          style={{ display: "block" }}
          target="_blank"
          truncate="end"
        >
          {attachment.fileName}
        </Anchor>
        <Text c="dimmed" mt={2} size="xs" truncate="end">
          {formatBytes(Number(attachment.fileSize))}
          {" · "}
          {formattedDate(new Date(attachment.createdAt))}
        </Text>
      </div>

      {attachment.creator && (
        <Tooltip
          label={t("Uploaded by {{name}}", { name: attachment.creator.name })}
          withArrow
        >
          <CustomAvatar
            avatarUrl={attachment.creator.avatarUrl}
            name={attachment.creator.name}
            size="sm"
          />
        </Tooltip>
      )}

      <Tooltip label={t("Download attachment")} withArrow>
        <ActionIcon
          aria-label={t("Download {{name}}", { name: attachment.fileName })}
          color="gray"
          component="a"
          download={attachment.fileName}
          href={fileUrl}
          rel="noopener noreferrer"
          target="_blank"
          variant="subtle"
        >
          <IconDownload size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
