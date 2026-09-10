import {
  ActionIcon,
  BoxProps,
  ElementProps,
  MantineColor,
  MantineSize,
} from "@mantine/core";
import {
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from "@tabler/icons-react";
import React from "react";

export interface SidebarToggleProps extends BoxProps, ElementProps<"button"> {
  color?: MantineColor;
  opened?: boolean;
  size?: MantineSize | `compact-${MantineSize}` | (string & {});
}

const SidebarToggle = React.forwardRef<HTMLButtonElement, SidebarToggleProps>(
  ({ opened, size = "sm", ...others }, ref) => (
    <ActionIcon
      aria-expanded={opened}
      size={size}
      {...others}
      color="gray"
      ref={ref}
      variant="subtle"
    >
      {opened ? (
        <IconLayoutSidebarRightExpand />
      ) : (
        <IconLayoutSidebarRightCollapse />
      )}
    </ActionIcon>
  )
);

export default SidebarToggle;
