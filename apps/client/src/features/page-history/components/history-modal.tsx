import { Modal, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { historyAtoms } from "@/features/page-history/atoms/history-atoms";
import HistoryModalBody from "@/features/page-history/components/history-modal-body";
import HistoryModalMobile from "@/features/page-history/components/history-modal-mobile";

interface Props {
  pageId: string;
  pageTitle?: string;
}

export default function HistoryModal({ pageId, pageTitle }: Props) {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useAtom(historyAtoms);
  const isMobile = useMediaQuery("(max-width: 800px)");

  if (isMobile) {
    return (
      <Modal.Root
        aria-label={t("Page history")}
        fullScreen
        onClose={() => setModalOpen(false)}
        opened={isModalOpen}
      >
        <Modal.Overlay />
        <Modal.Content style={{ overflow: "hidden" }}>
          <Modal.Header>
            <Modal.Title>
              <Text fw={500} size="md">
                {t("Page history")}
              </Text>
            </Modal.Title>
            <Modal.CloseButton aria-label={t("Close")} />
          </Modal.Header>
          <Modal.Body
            p={0}
            style={{ height: "calc(100vh - 60px)", overflow: "hidden" }}
          >
            <HistoryModalMobile pageId={pageId} pageTitle={pageTitle} />
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    );
  }

  return (
    <Modal.Root
      aria-label={t("Page history")}
      onClose={() => setModalOpen(false)}
      opened={isModalOpen}
      size={1400}
    >
      <Modal.Overlay />
      <Modal.Content style={{ overflow: "hidden" }}>
        <Modal.Header>
          <Modal.Title>
            <Text fw={500} size="md">
              {t("Page history")}
            </Text>
          </Modal.Title>
          <Modal.CloseButton aria-label={t("Close")} />
        </Modal.Header>
        <Modal.Body>
          <HistoryModalBody pageId={pageId} />
        </Modal.Body>
      </Modal.Content>
    </Modal.Root>
  );
}
