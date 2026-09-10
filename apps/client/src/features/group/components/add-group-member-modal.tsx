import { Button, Divider, Group, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { MultiUserSelect } from "@/features/group/components/multi-user-select.tsx";
import { useAddGroupMemberMutation } from "@/features/group/queries/group-query.ts";

export default function AddGroupMemberModal() {
  const { t } = useTranslation();
  const { groupId } = useParams();
  const [opened, { open, close }] = useDisclosure(false);
  const [userIds, setUserIds] = useState<string[]>([]);
  const addGroupMemberMutation = useAddGroupMemberMutation();

  const handleMultiSelectChange = (value: string[]) => {
    setUserIds(value);
  };

  const handleSubmit = async () => {
    const addGroupMember = {
      groupId,
      userIds,
    };

    await addGroupMemberMutation.mutateAsync(addGroupMember);
    close();
  };

  return (
    <>
      <Button onClick={open}>{t("Add group members")}</Button>

      <Modal
        closeButtonProps={{ "aria-label": t("Close") }}
        onClose={close}
        opened={opened}
        title={t("Add group members")}
      >
        <Divider mb="xs" size="xs" />

        <MultiUserSelect
          label={t("Add group members")}
          onChange={handleMultiSelectChange}
        />

        <Group justify="flex-end" mt="md">
          <Button onClick={handleSubmit} type="submit">
            {t("Add")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
