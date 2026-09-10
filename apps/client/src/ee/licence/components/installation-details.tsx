import { Group, Paper, SimpleGrid, Text, TextInput } from "@mantine/core";
import { useAtom } from "jotai";
import CopyTextButton from "@/components/common/copy.tsx";
import classes from "@/ee/billing/components/billing.module.css";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom.ts";
import useUserRole from "@/hooks/use-user-role.tsx";

export default function InstallationDetails() {
  const { isAdmin } = useUserRole();
  const [workspace] = useAtom(workspaceAtom);

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 2, xs: 2 }}>
        <Paper p="sm" radius="md" withBorder={true}>
          <Group grow justify="apart">
            <div>
              <Text
                c="dimmed"
                className={classes.label}
                fw={700}
                fz="xs"
                tt="uppercase"
              >
                Workspace ID
              </Text>
              <TextInput
                pointer
                readOnly
                rightSection={<CopyTextButton text={workspace?.id} />}
                style={{ fontWeight: 700 }}
                value={workspace?.id}
                variant="unstyled"
              />
            </div>
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder={true}>
          <Group justify="apart">
            <div>
              <Text
                c="dimmed"
                className={classes.label}
                fw={700}
                fz="xs"
                tt="uppercase"
              >
                Member count
              </Text>
              <Text fw={700} fz="lg" tt="capitalize">
                {workspace?.memberCount}
              </Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>
    </>
  );
}
