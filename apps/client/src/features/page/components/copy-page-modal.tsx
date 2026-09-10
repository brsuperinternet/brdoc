import { Button, Group, Modal, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { duplicatePage } from "@/features/page/services/page-service.ts";
import { SpaceSelect } from "@/features/space/components/sidebar/space-select.tsx";
import { ISpace } from "@/features/space/types/space.types.ts";
import { queryClient } from "@/main.tsx";

interface CopyPageModalProps {
  currentSpaceSlug: string;
  onClose: () => void;
  open: boolean;
  pageId: string;
}

export default function CopyPageModal({
  pageId,
  currentSpaceSlug,
  open,
  onClose,
}: CopyPageModalProps) {
  const { t } = useTranslation();
  const [targetSpace, setTargetSpace] = useState<ISpace>(null);
  const navigate = useNavigate();

  const handleCopy = async () => {
    if (!targetSpace) {
      return;
    }

    try {
      const copiedPage = await duplicatePage({
        pageId,
        spaceId: targetSpace.id,
      });
      queryClient.removeQueries({
        predicate: (item) =>
          ["pages", "sidebar-pages", "root-sidebar-pages"].includes(
            item.queryKey[0] as string
          ),
      });

      const pageUrl = buildPageUrl(
        copiedPage.space.slug,
        copiedPage.slugId,
        copiedPage.title
      );
      navigate(pageUrl);
      notifications.show({
        message: t("Page copied successfully"),
      });
      onClose();
      setTargetSpace(null);
    } catch (err) {
      notifications.show({
        color: "red",
        message: err.response?.data.message || "An error occurred",
      });
      console.log(err);
    }
  };

  const handleChange = (space: ISpace) => {
    setTargetSpace(space);
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
          <Modal.Title fw={500}>{t("Copy page")}</Modal.Title>
          <Modal.CloseButton aria-label={t("Close")} />
        </Modal.Header>
        <Modal.Body>
          <Text c="dimmed" mb="xs" size="sm">
            {t("Copy page to a different space.")}
          </Text>

          <SpaceSelect
            clearable={false}
            onChange={handleChange}
            value={currentSpaceSlug}
          />
          <Group justify="end" mt="md">
            <Button onClick={onClose} variant="default">
              {t("Cancel")}
            </Button>
            <Button onClick={handleCopy}>{t("Copy")}</Button>
          </Group>
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
