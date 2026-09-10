import { Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useBacklinksCountQuery } from "@/features/page-details/queries/backlinks-query.ts";
import { BacklinksList } from "./backlinks-list";

interface BacklinksModalProps {
  onClose: () => void;
  opened: boolean;
  pageId: string;
}

export function BacklinksModal({
  pageId,
  opened,
  onClose,
}: BacklinksModalProps) {
  const { t } = useTranslation();
  const { data: counts } = useBacklinksCountQuery(pageId);

  return (
    <Modal.Root onClose={onClose} opened={opened} size={640} yOffset="10vh">
      <Modal.Overlay />
      <Modal.Content>
        <Modal.Header>
          <Modal.Title fw={500}>{t("Backlinks")}</Modal.Title>
          <Modal.CloseButton aria-label={t("Close")} />
        </Modal.Header>
        <Modal.Body>
          <Stack gap="lg">
            <Stack gap="xs">
              <Text c="dimmed" fw={500} size="sm">
                {t("Incoming links ({{count}})", {
                  count: counts?.incoming ?? 0,
                })}
              </Text>
              <BacklinksList
                direction="incoming"
                enabled={opened}
                onItemClick={onClose}
                pageId={pageId}
              />
            </Stack>

            <Stack gap="xs">
              <Text c="dimmed" fw={500} size="sm">
                {t("Outgoing links ({{count}})", {
                  count: counts?.outgoing ?? 0,
                })}
              </Text>
              <BacklinksList
                direction="outgoing"
                enabled={opened}
                onItemClick={onClose}
                pageId={pageId}
              />
            </Stack>
          </Stack>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
