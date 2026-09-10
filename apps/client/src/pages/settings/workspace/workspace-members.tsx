import { Group, SegmentedControl, Space } from "@mantine/core";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import SettingsTitle from "@/components/settings/settings-title.tsx";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import WorkspaceInviteModal from "@/features/workspace/components/members/components/workspace-invite-modal";
import WorkspaceInvitesTable from "@/features/workspace/components/members/components/workspace-invites-table.tsx";
import WorkspaceMembersTable from "@/features/workspace/components/members/components/workspace-members-table";
import useUserRole from "@/hooks/use-user-role.tsx";

export default function WorkspaceMembers() {
  const { t } = useTranslation();
  const [segmentValue, setSegmentValue] = useState("members");
  const [workspace] = useAtom(workspaceAtom);
  const [searchParams] = useSearchParams();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab === "invites") {
      setSegmentValue(currentTab);
    }
  }, [searchParams.get("tab")]);

  const handleSegmentChange = (value: string) => {
    setSegmentValue(value);
    if (value === "invites") {
      navigate(`?tab=${value}`);
    } else {
      navigate("");
    }
  };

  return (
    <>
      <DocumentTitle title={t("Members")} />
      <SettingsTitle title={t("Members")} />

      {/* <WorkspaceInviteSection /> */}
      {/* <Divider my="lg" /> */}

      <Group justify="space-between">
        <SegmentedControl
          data={[
            {
              label: t("Members") + ` (${workspace?.memberCount})`,
              value: "members",
            },
            { label: t("Pending"), value: "invites" },
          ]}
          onChange={handleSegmentChange}
          value={segmentValue}
          withItemsBorders={false}
        />

        {isAdmin && <WorkspaceInviteModal />}
      </Group>

      <Space h="lg" />

      {segmentValue === "invites" ? (
        <WorkspaceInvitesTable />
      ) : (
        <WorkspaceMembersTable />
      )}
    </>
  );
}
