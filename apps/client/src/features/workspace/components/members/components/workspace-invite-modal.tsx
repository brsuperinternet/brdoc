import { Button, Divider, Modal, ScrollArea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { WorkspaceInviteForm } from "@/features/workspace/components/members/components/workspace-invite-form.tsx";

export default function WorkspaceInviteModal() {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button onClick={open}>{t("Invite members")}</Button>

      <Modal
        centered
        onClose={close}
        opened={opened}
        size="550"
        title={t("Invite new members")}
      >
        <Divider mb="xs" size="xs" />

        <ScrollArea h="80%">
          <WorkspaceInviteForm onClose={close} />
        </ScrollArea>
      </Modal>
    </>
  );
}
