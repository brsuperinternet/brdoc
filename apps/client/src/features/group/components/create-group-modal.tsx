import { Button, Divider, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { CreateGroupForm } from "@/features/group/components/create-group-form.tsx";

export default function CreateGroupModal() {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>{t("Create group")}</Button>

      <Modal
        closeButtonProps={{ "aria-label": t("Close") }}
        onClose={close}
        opened={opened}
        title={t("Create group")}
      >
        <Divider mb="xs" size="xs" />
        <CreateGroupForm />
      </Modal>
    </>
  );
}
