import { Stack, Text } from "@mantine/core";
import { type TablerIcon } from "@tabler/icons-react";
import { ReactNode } from "react";
import classes from "./empty-state.module.css";

type EmptyStateProps = {
  icon: TablerIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className={classes.root}>
      <Stack align="center" gap="xs">
        <Icon color="var(--mantine-color-dimmed)" size={40} stroke={1.5} />
        <Text fw={500} size="lg">
          {title}
        </Text>
        {description && (
          <Text c="dimmed" maw={350} size="sm">
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </div>
  );
}
