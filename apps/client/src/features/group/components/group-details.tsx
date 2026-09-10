import { Group, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useParams } from "react-router-dom";
import AddGroupMemberModal from "@/features/group/components/add-group-member-modal";
import EditGroupModal from "@/features/group/components/edit-group-modal.tsx";
import GroupActionMenu from "@/features/group/components/group-action-menu.tsx";
import { useGroupQuery } from "@/features/group/queries/group-query";
import useUserRole from "@/hooks/use-user-role.tsx";

export default function GroupDetails() {
  const { groupId } = useParams();
  const { data: group, isLoading } = useGroupQuery(groupId);
  const [opened, { open, close }] = useDisclosure(false);
  const { isAdmin } = useUserRole();

  return (
    <>
      {group && (
        <div>
          {/* Todo: back navigation */}
          <Title order={4}>{group.name}</Title>
          <Text c="dimmed">{group.description}</Text>

          <Group justify="flex-end" my="md">
            {isAdmin && (
              <>
                <AddGroupMemberModal />
                <GroupActionMenu />
              </>
            )}
          </Group>
        </div>
      )}

      <EditGroupModal onClose={close} opened={opened} />
    </>
  );
}
