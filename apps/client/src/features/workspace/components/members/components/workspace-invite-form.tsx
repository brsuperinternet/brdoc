import { Box, Button, Group, Select, TagsInput } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MultiGroupSelect } from "@/features/group/components/multi-group-select.tsx";
import { useCreateInvitationMutation } from "@/features/workspace/queries/workspace-query.ts";
import { userRoleData } from "@/features/workspace/types/user-role-data.ts";
import { UserRole } from "@/lib/types.ts";

interface Props {
  onClose: () => void;
}
export function WorkspaceInviteForm({ onClose }: Props) {
  const { t } = useTranslation();
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(UserRole.MEMBER);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const createInvitationMutation = useCreateInvitationMutation();
  const navigate = useNavigate();

  async function handleSubmit() {
    const validEmails = emails.filter((email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    });

    await createInvitationMutation.mutateAsync({
      emails: validEmails,
      groupIds,
      role: role.toLowerCase(),
    });

    onClose();

    navigate("?tab=invites");
  }

  const handleGroupSelect = (value: string[]) => {
    setGroupIds(value);
  };

  return (
    <>
      <Box maw="500" mx="auto">
        {/*<WorkspaceInviteSection /> */}

        <TagsInput
          autoComplete="off"
          data-1p-ignore
          data-autofocus
          data-bwignore
          data-form-type="other"
          data-lpignore="true"
          description={t(
            "Enter valid email addresses separated by comma or space max_50"
          )}
          label={t("Invite by email")}
          maxDropdownHeight={200}
          maxTags={50}
          mt="sm"
          onChange={setEmails}
          placeholder={t("enter valid emails addresses")}
          splitChars={[",", " "]}
          variant="filled"
        />

        <Select
          allowDeselect={false}
          checkIconPosition="right"
          data={userRoleData
            .filter((role) => role.value !== UserRole.OWNER)
            .map((role) => ({
              ...role,
              description: t(`${role.description}`),
              label: t(`${role.label}`),
            }))}
          defaultValue={UserRole.MEMBER}
          description={t("Select role to assign to all invited members")}
          label={t("Select role")}
          mt="sm"
          onChange={(value) => setRole(value)}
          placeholder={t("Choose a role")}
          variant="filled"
        />

        <MultiGroupSelect
          description={t(
            "Invited members will be granted access to spaces the groups can access"
          )}
          label={t("Add to groups")}
          mt="sm"
          onChange={handleGroupSelect}
        />

        <Group justify="flex-end" mt="md">
          <Button
            loading={createInvitationMutation.isPending}
            onClick={handleSubmit}
          >
            {t("Send invitation")}
          </Button>
        </Group>
      </Box>
    </>
  );
}
