import { Group, Text, UnstyledButton } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { getHostnameUrl } from "@/ee/utils.ts";
import { IWorkspace } from "@/features/workspace/types/workspace.types.ts";
import { useJoinedWorkspacesQuery } from "../cloud/query/cloud-query";
import classes from "./joined-workspaces.module.css";

export default function JoinedWorkspaces() {
  const { data, isLoading } = useJoinedWorkspacesQuery();
  if (isLoading || !data || data?.length === 0) {
    return null;
  }

  return (
    <>
      {data
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((workspace: Partial<IWorkspace>, index) => (
          <UnstyledButton
            className={classes.workspace}
            component={Link}
            key={index}
            to={getHostnameUrl(workspace?.hostname) + "/home"}
          >
            <Group wrap="nowrap">
              <CustomAvatar
                avatarUrl={workspace?.logo}
                name={workspace?.name}
                size="md"
                variant="filled"
              />

              <div style={{ flex: 1 }}>
                <Text fw={500} lineClamp={1} size="sm">
                  {workspace?.name}
                </Text>

                <Text c="dimmed" size="sm">
                  {getHostnameUrl(workspace?.hostname)?.split("//")[1]}
                </Text>
              </div>

              <IconChevronRight size={16} />
            </Group>
          </UnstyledButton>
        ))}
    </>
  );
}
