import { Group, Menu, Text, UnstyledButton } from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconLock,
  IconShieldLock,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import classes from "./page-permission.module.css";

type AccessLevel = "open" | "restricted";

type GeneralAccessSelectProps = {
  value: AccessLevel;
  onChange: (value: AccessLevel) => void;
  disabled?: boolean;
  hasInheritedRestriction?: boolean;
};

export function GeneralAccessSelect({
  value,
  onChange,
  disabled,
  hasInheritedRestriction,
}: GeneralAccessSelectProps) {
  const { t } = useTranslation();

  const isDirectlyRestricted = value === "restricted";
  const showInheritedState = hasInheritedRestriction && !isDirectlyRestricted;

  const currentLabel = showInheritedState
    ? t("Restricted by parent")
    : isDirectlyRestricted
      ? t("Restricted")
      : t("Open");

  const currentDescription = showInheritedState
    ? t("Inherits restrictions from ancestor page")
    : isDirectlyRestricted
      ? t("Only people listed below can access this page")
      : t("Everyone in this space can access");

  const CurrentIcon = showInheritedState
    ? IconShieldLock
    : isDirectlyRestricted
      ? IconLock
      : IconShieldLock;

  const accessOptions = [
    {
      description: hasInheritedRestriction
        ? t("Use only inherited restrictions")
        : t("No additional restrictions on this page"),
      icon: IconShieldLock,
      label: hasInheritedRestriction ? t("Restricted by parent") : t("Open"),
      value: "open" as const,
    },
    {
      description: hasInheritedRestriction
        ? t("Add restrictions on top of inherited")
        : t("Only specific people can access"),
      icon: IconLock,
      label: t("Restricted"),
      value: "restricted" as const,
    },
  ];

  return (
    <Menu disabled={disabled} withArrow>
      <Menu.Target>
        <UnstyledButton
          className={classes.generalAccessBox}
          disabled={disabled}
        >
          <div
            className={`${classes.generalAccessIcon} ${isDirectlyRestricted || showInheritedState ? classes.generalAccessIconRestricted : ""}`}
          >
            <CurrentIcon size={18} stroke={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <Group gap={4}>
              <Text fw={500} size="sm">
                {currentLabel}
              </Text>
              {!disabled && <IconChevronDown size={14} />}
            </Group>
            <Text c="dimmed" size="xs">
              {currentDescription}
            </Text>
          </div>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        {accessOptions.map((option) => (
          <Menu.Item
            key={option.value}
            leftSection={<option.icon size={16} stroke={1.5} />}
            onClick={() => onChange(option.value)}
            rightSection={
              option.value === value ? <IconCheck size={16} /> : null
            }
          >
            <div>
              <Text size="sm">{option.label}</Text>
              <Text c="dimmed" size="xs">
                {option.description}
              </Text>
            </div>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
