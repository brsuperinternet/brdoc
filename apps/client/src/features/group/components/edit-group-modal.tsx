import { Divider, Modal } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { EditGroupForm } from "@/features/group/components/edit-group-form.tsx";
import { IGroup } from "@/features/group/types/group.types.ts";

interface EditGroupModalProps {
  group?: IGroup;
  onClose: () => void;
  opened: boolean;
}

export default function EditGroupModal({
  opened,
  onClose,
  group,
}: EditGroupModalProps) {
  const { t } = useTranslation();

  return (
    <>
      <Modal
        closeButtonProps={{ "aria-label": t("Close") }}
        onClose={onClose}
        opened={opened}
        title={t("Edit group")}
      >
        <Divider mb="xs" size="xs" />
        <EditGroupForm group={group} onClose={onClose} />
      </Modal>
    </>
  );
}
