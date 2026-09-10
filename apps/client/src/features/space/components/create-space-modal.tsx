import { Button, Divider, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { CreateSpaceForm } from "@/features/space/components/create-space-form.tsx";

export default function CreateSpaceModal() {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>{t("Create space")}</Button>

      <Modal
        closeButtonProps={{ "aria-label": t("Close") }}
        onClose={close}
        opened={opened}
        title={t("Create space")}
      >
        <Divider mb="xs" size="xs" />
        <CreateSpaceForm />
      </Modal>
    </>
  );
}
