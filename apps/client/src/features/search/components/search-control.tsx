import {
  ActionIcon,
  BoxProps,
  ElementProps,
  Group,
  rem,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import cx from "clsx";
import { useTranslation } from "react-i18next";
import { platformModifierLabel } from "@/lib";
import classes from "./search-control.module.css";

interface SearchControlProps extends BoxProps, ElementProps<"button"> {}

export function SearchControl({ className, ...others }: SearchControlProps) {
  const { t } = useTranslation();

  return (
    <UnstyledButton {...others} className={cx(classes.root, className)}>
      <Group gap="xs" wrap="nowrap">
        <IconSearch stroke={1.5} style={{ height: rem(15), width: rem(15) }} />
        <Text c="dimmed" fz="sm" pr={80}>
          {t("Search")}
        </Text>
        <Text className={classes.shortcut} fw={700}>
          {platformModifierLabel} + K
        </Text>
      </Group>
    </UnstyledButton>
  );
}

interface SearchMobileControlProps {
  onSearch: () => void;
}

export function SearchMobileControl({ onSearch }: SearchMobileControlProps) {
  const { t } = useTranslation();

  return (
    <Tooltip label={t("Search")} withArrow>
      <ActionIcon
        aria-label={t("Search")}
        color="dark"
        onClick={onSearch}
        size="sm"
        variant="subtle"
      >
        <IconSearch size={20} stroke={2} />
      </ActionIcon>
    </Tooltip>
  );
}
