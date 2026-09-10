import { Group, SelectProps, Text } from "@mantine/core";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { IUser } from "@/features/user/types/user.types";

export const MAX_VERIFIERS = 5;

export type UserOptionItem = {
  value: string;
  label: string;
  email: string;
  avatarUrl: string;
};

export function toUserOptions(users: IUser[] | undefined): UserOptionItem[] {
  return (users ?? []).map((user) => ({
    avatarUrl: user.avatarUrl,
    email: user.email,
    label: user.name,
    value: user.id,
  }));
}

export const renderUserSelectOption: SelectProps["renderOption"] = ({
  option,
}) => (
  <Group gap="sm" wrap="nowrap">
    <CustomAvatar
      avatarUrl={option["avatarUrl"]}
      name={option.label}
      size={20}
    />
    <div>
      <Text lineClamp={1} size="sm">
        {option.label}
      </Text>
      {option["email"] && (
        <Text c="dimmed" lineClamp={1} size="xs">
          {option["email"]}
        </Text>
      )}
    </div>
  </Group>
);
