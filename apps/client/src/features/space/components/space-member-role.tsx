import { Group, Select, SelectProps, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { spaceRoleData } from "@/features/space/types/space-role-data.ts";
import { IRoleData } from "@/lib/types.ts";

const iconProps = {
  color: "currentColor",
  opacity: 0.6,
  size: 18,
  stroke: 1.5,
};

const renderSelectOption: SelectProps["renderOption"] = ({
  option,
  checked,
}) => (
  <Group flex="1" gap="xs">
    <div>
      <Text size="sm">{option.label}</Text>
      <Text opacity={0.65} size="xs">
        {option["description"]}
      </Text>
    </div>{" "}
    {checked && (
      <IconCheck style={{ marginInlineStart: "auto" }} {...iconProps} />
    )}
  </Group>
);

interface SpaceMemberRoleProps {
  defaultRole: string;
  label?: string;
  onSelect: (value: string) => void;
}

export function SpaceMemberRole({
  onSelect,
  defaultRole,
  label,
}: SpaceMemberRoleProps) {
  const { t } = useTranslation();

  return (
    <Select
      allowDeselect={false}
      data={spaceRoleData.map((role: IRoleData) => ({
        description: t(role.description),
        label: t(role.label),
        value: role.value,
      }))}
      defaultValue={defaultRole}
      label={label}
      onChange={onSelect}
      renderOption={renderSelectOption}
      variant="filled"
    />
  );
}
