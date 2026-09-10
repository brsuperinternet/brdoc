import { Group, Text } from "@mantine/core";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { IUser } from "@/features/user/types/user.types.ts";

interface UserInfoProps {
  size?: string;
  user: Partial<IUser>;
}
export function UserInfo({ user, size }: UserInfoProps) {
  return (
    <Group gap="sm" wrap="nowrap">
      <CustomAvatar avatarUrl={user?.avatarUrl} name={user?.name} size={size} />
      <div>
        <Text fw={500} fz="sm" lineClamp={1}>
          {user?.name}
        </Text>
        <Text c="dimmed" fz="xs">
          {user?.email}
        </Text>
      </div>
    </Group>
  );
}
