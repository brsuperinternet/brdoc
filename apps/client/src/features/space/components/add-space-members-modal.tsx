import { Button, Divider, Group, Modal, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { MultiMemberSelect } from "@/features/space/components/multi-member-select.tsx";
import { SpaceMemberRole } from "@/features/space/components/space-member-role.tsx";
import { useAddSpaceMemberMutation } from "@/features/space/queries/space-query.ts";
import { SpaceRole } from "@/lib/types.ts";

interface AddSpaceMemberModalProps {
  spaceId: string;
}
export default function AddSpaceMembersModal({
  spaceId,
}: AddSpaceMemberModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [opened, { open, close }] = useDisclosure(false);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [role, setRole] = useState<string>(SpaceRole.WRITER);
  const addSpaceMemberMutation = useAddSpaceMemberMutation();

  const handleMultiSelectChange = (value: string[]) => {
    setMemberIds(value);
  };

  const handleRoleSelection = (role: string) => {
    setRole(role);
  };

  const handleSubmit = async () => {
    // member can be a users or groups
    const userIds = memberIds
      .map((id) => (id.startsWith("user-") ? id.split("user-")[1] : null))
      .filter((id) => id !== null);

    const groupIds = memberIds
      .map((id) => (id.startsWith("group-") ? id.split("group-")[1] : null))
      .filter((id) => id !== null);

    const addSpaceMember = {
      groupIds,
      role,
      spaceId,
      userIds,
    };

    await addSpaceMemberMutation.mutateAsync(addSpaceMember);
    close();
  };

  return (
    <>
      <Button onClick={open}>{t("Add space members")}</Button>
      <Modal.Root onClose={close} opened={opened}>
        <Modal.Overlay />
        <Modal.Content aria-labelledby={titleId}>
          <Modal.Header>
            <Modal.Title id={titleId}>{t("Add space members")}</Modal.Title>
            <Modal.CloseButton aria-label={t("Close")} />
          </Modal.Header>
          <Modal.Body>
            <Divider mb="xs" size="xs" />

            <Stack>
              <MultiMemberSelect onChange={handleMultiSelectChange} />
              <SpaceMemberRole
                defaultRole={role}
                label={t("Select role")}
                onSelect={handleRoleSelection}
              />
            </Stack>

            <Group justify="flex-end" mt="md">
              <Button onClick={handleSubmit} type="submit">
                {t("Add")}
              </Button>
            </Group>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}
