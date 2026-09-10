import { Button, Group, Menu, Text } from "@mantine/core";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import React, { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { IRoleData } from "@/lib/types.ts";

interface RoleButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  name: string;
}

const RoleButton = forwardRef<HTMLButtonElement, RoleButtonProps>(
  ({ name, ...others }: RoleButtonProps, ref) => (
    <Button
      ref={ref}
      rightSection={<IconChevronDown size="1rem" />}
      style={{
        border: "none",
      }}
      variant="default"
      {...others}
    >
      {name}
    </Button>
  )
);

interface RoleMenuProps {
  disabled?: boolean;
  onChange?: (value: string) => void;
  roleName: string;
  roles: IRoleData[];
}

export default function RoleSelectMenu({
  roles,
  roleName,
  onChange,
  disabled,
}: RoleMenuProps) {
  const { t } = useTranslation();

  return (
    <Menu withArrow>
      <Menu.Target>
        <RoleButton disabled={disabled} name={t(roleName)} />
      </Menu.Target>

      <Menu.Dropdown>
        {roles?.map((item) => (
          <Menu.Item
            key={item.value}
            onClick={() => onChange && onChange(item.value)}
          >
            <Group flex="1" gap="xs">
              <div>
                <Text size="sm">{t(item.label)}</Text>
                <Text opacity={0.65} size="xs">
                  {t(item.description)}
                </Text>
              </div>
              {item.label === roleName && <IconCheck size={20} />}
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
