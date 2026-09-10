import { ActionIcon, Menu, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { IconDots, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import EditGroupModal from "@/features/group/components/edit-group-modal.tsx";
import {
  useDeleteGroupMutation,
  useGroupQuery,
} from "@/features/group/queries/group-query";
import { IGroup } from "@/features/group/types/group.types.ts";

interface GroupActionMenuProps {
  group?: IGroup;
}

export default function GroupActionMenu(props: GroupActionMenuProps = {}) {
  const { t } = useTranslation();
  const { groupId: routeGroupId } = useParams();
  const groupId = props.group?.id ?? routeGroupId;
  const { data: queriedGroup } = useGroupQuery(
    props.group ? undefined : groupId
  );
  const group = props.group ?? queriedGroup;
  const deleteGroupMutation = useDeleteGroupMutation();
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);

  const onDelete = async () => {
    await deleteGroupMutation.mutateAsync(groupId);
    // Only navigate away if we're currently viewing this group's detail page.
    if (routeGroupId === groupId) {
      navigate("/settings/groups");
    }
  };

  const openDeleteModal = () =>
    modals.openConfirmModal({
      centered: true,
      children: (
        <Text size="sm">
          {t(
            "Are you sure you want to delete this group? Members will lose access to resources this group has access to."
          )}
        </Text>
      ),
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Delete") },
      onConfirm: onDelete,
      title: t("Delete group"),
    });

  return (
    <>
      {group && (
        <>
          <Menu
            arrowPosition="center"
            offset={20}
            position="bottom-end"
            shadow="xl"
            width={200}
            withArrow
          >
            <Menu.Target>
              <ActionIcon
                aria-label={t("Group actions for {{name}}", {
                  name: group.name,
                })}
                color="gray"
                variant="subtle"
              >
                <IconDots size={20} stroke={2} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item disabled={group.isDefault} onClick={open}>
                {t("Edit group")}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                c="red"
                disabled={group.isDefault}
                leftSection={<IconTrash size={16} stroke={2} />}
                onClick={openDeleteModal}
              >
                {t("Delete group")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </>
      )}

      <EditGroupModal group={group} onClose={close} opened={opened} />
    </>
  );
}
