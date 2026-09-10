import { ThemeIcon } from "@mantine/core";
import { IconUsersGroup } from "@tabler/icons-react";

export function IconGroupCircle() {
  return (
    <ThemeIcon color="gray" radius="xl" size="lg" variant="light">
      <IconUsersGroup stroke={1.5} />
    </ThemeIcon>
  );
}
